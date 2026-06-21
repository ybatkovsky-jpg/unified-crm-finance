"""
RabbitMQ consumer for background message processing.

Uses aio-pika for async connection management and message consumption.
Subscribes to the 'notifications' queue for handling background tasks.
"""
import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from aio_pika import Channel, Connection, ExchangeType, Message, Queue, connect_robust
from aio_pika.exceptions import AMQPError

from app.config import settings

logger = logging.getLogger(__name__)


class RabbitMQConsumer:
    """
    Async RabbitMQ consumer using aio-pika.

    Manages connection lifecycle, queue subscription, and message processing.
    """

    def __init__(self, url: str | None = None) -> None:
        """
        Initialize consumer.

        Args:
            url: RabbitMQ AMQP URL (defaults to settings.rabbitmq_url)
        """
        self.amqp_url = url or settings.rabbitmq_url
        self.connection: Connection | None = None
        self.channel: Channel | None = None
        self.queue: Queue | None = None
        self._consuming = False
        self._consumer_tag: str | None = None
        self._message_handler: Callable[[dict[str, Any]], Awaitable[None]] | None = None

    async def connect(self) -> None:
        """
        Establish connection to RabbitMQ and set up channel.

        Raises:
            AMQPError: If connection fails
        """
        try:
            logger.info(f"Connecting to RabbitMQ at {self.amqp_url}")
            self.connection = await connect_robust(self.amqp_url)
            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=10)  # Process 10 messages at a time
            logger.info("RabbitMQ connected successfully")
        except AMQPError as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    async def declare_queue(self, queue_name: str = "notifications") -> None:
        """
        Declare a queue for message consumption.

        Args:
            queue_name: Name of the queue to declare
        """
        if not self.channel:
            raise RuntimeError("Channel not initialized. Call connect() first.")

        self.queue = await self.channel.declare_queue(
            queue_name,
            durable=True,  # Survive broker restart
            arguments={"x-max-length": 10000},  # Max 10k messages
        )
        logger.info(f"Queue '{queue_name}' declared")

    async def declare_exchange(
        self,
        exchange_name: str = "notifications",
        exchange_type: ExchangeType = ExchangeType.FANOUT,
    ) -> None:
        """
        Declare an exchange and bind queue to it.

        Args:
            exchange_name: Name of the exchange
            exchange_type: Type of exchange (direct, fanout, topic)
        """
        if not self.channel or not self.queue:
            raise RuntimeError("Channel or queue not initialized.")

        exchange = await self.channel.declare_exchange(
            exchange_name,
            exchange_type,
            durable=True,
        )
        await self.queue.bind(exchange)
        logger.info(f"Queue bound to exchange '{exchange_name}'")

    def set_message_handler(
        self, handler: Callable[[dict[str, Any]], Awaitable[None]]
    ) -> None:
        """
        Set the async message handler callback.

        Args:
            handler: Async function that receives message payload dict
        """
        self._message_handler = handler

    async def _process_message(self, message: Message) -> None:
        """
        Process a single message from the queue.

        Parses JSON body and calls the registered handler.
        Automatically acknowledges on success, rejects on failure.

        Args:
            message: aio-pika Message object
        """
        async with message.process():
            try:
                body = message.body.decode()
                payload = json.loads(body) if body else {}
                logger.info(f"Received message: {payload.get('type', 'unknown')}")

                if self._message_handler:
                    await self._message_handler(payload)
                else:
                    logger.warning("No message handler set, message acknowledged")

            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in message: {e}")
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                raise

    async def start_consuming(self, queue_name: str = "notifications") -> None:
        """
        Start consuming messages from the queue.

        This is a blocking call that runs until stop_consuming() is called.

        Args:
            queue_name: Name of the queue to consume from
        """
        if not self.channel:
            await self.connect()

        if not self.queue or self.queue.name != queue_name:
            await self.declare_queue(queue_name)

        logger.info(f"Starting consumption from queue '{queue_name}'")
        self._consuming = True

        async with self.queue.iterator() as queue_iter:
            async for message in queue_iter:
                if not self._consuming:
                    break
                await self._process_message(message)

    async def stop_consuming(self) -> None:
        """Stop consuming messages and cancel the consumer tag."""
        if self._consumer_tag and self.channel:
            await self.channel.basic_cancel(self._consumer_tag)
            self._consumer_tag = None
        self._consuming = False
        logger.info("Stopped consuming messages")

    async def close(self) -> None:
        """Close the RabbitMQ connection gracefully."""
        await self.stop_consuming()
        if self.connection:
            await self.connection.close()
            self.connection = None
            self.channel = None
            self.queue = None
            logger.info("RabbitMQ connection closed")

    async def publish_message(
        self,
        exchange_name: str,
        routing_key: str,
        payload: dict[str, Any],
    ) -> None:
        """
        Publish a message to an exchange.

        Args:
            exchange_name: Target exchange name
            routing_key: Routing key for the message
            payload: Message payload (will be JSON serialized)
        """
        if not self.channel:
            await self.connect()

        exchange = await self.channel.declare_exchange(exchange_name, ExchangeType.FANOUT)
        await exchange.publish(
            Message(body=json.dumps(payload).encode()),
            routing_key=routing_key,
        )
        logger.info(f"Published message to {exchange_name}")


async def default_message_handler(payload: dict[str, Any]) -> None:
    """
    Default message handler that logs received messages.

    Args:
        payload: Message payload dictionary
    """
    msg_type = payload.get("type", "unknown")
    logger.info(f"Processing message: {msg_type} - {payload}")
