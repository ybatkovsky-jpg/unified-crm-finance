"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { RefreshCwIcon, ArrowLeftIcon, PhoneIcon, MailIcon, Building2Icon, UserIcon } from "lucide-react"

import { contactsApi, ApiClientError } from "@/lib/api/contacts"
import type { ContactData } from "@/lib/api/types"
import { InteractionTimeline } from "@/components/crm/interaction-timeline"
import { InteractionForm } from "@/components/crm/interaction-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock author ID for MVP - will be replaced with real auth context
const MOCK_AUTHOR_ID = "00000000-0000-0000-0000-000000000001"

function getDisplayName(contact: ContactData): string {
  if (contact.type === "company") {
    return contact.companyName || "\u2014"
  }
  return [contact.lastName, contact.firstName].filter(Boolean).join(" ") || "\u2014"
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const contactId = id
  const [contact, setContact] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timelineKey, setTimelineKey] = useState(0)

  const fetchContact = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await contactsApi.getContact(contactId)
      setContact(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 404) {
          setError("Contact not found")
        } else {
          setError(err.message)
        }
      } else {
        setError("Failed to load contact. Please try again.")
      }
      console.error("Contact fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [contactId])

  useEffect(() => {
    fetchContact()
  }, [fetchContact])

  const handleRetry = () => {
    fetchContact()
  }

  const handleInteractionSuccess = () => {
    // Trigger timeline refresh by updating key
    setTimelineKey((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading contact...</span>
        </div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error || "Contact not found"}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCwIcon className="size-4" />
                  <span className="ml-1.5">Retry</span>
                </Button>
                <Link href="/crm/contacts">
                  <Button variant="outline">
                    <ArrowLeftIcon className="size-4" />
                    <span className="ml-1.5">Back to Contacts</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <Link href="/crm/contacts" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeftIcon className="size-4 mr-1" />
        Back to Contacts
      </Link>

      {/* Contact details header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {contact.type === "company" ? (
                  <Building2Icon className="size-5 text-muted-foreground" />
                ) : (
                  <UserIcon className="size-5 text-muted-foreground" />
                )}
                <CardTitle className="text-2xl">{getDisplayName(contact)}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={contact.type === "company" ? "secondary" : "default"}
                >
                  {contact.type === "company" ? "Company" : "Person"}
                </Badge>
                <Badge
                  variant={contact.status === "active" ? "default" : "outline"}
                >
                  {contact.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <MailIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{contact.email}</span>
              </div>
            )}
            {contact.type === "person" && contact.position && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Position:</span>
                <span>{contact.position}</span>
              </div>
            )}
            {contact.type === "company" && contact.inn && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">INN:</span>
                <span>{contact.inn}</span>
              </div>
            )}
          </div>
          {contact.address && (
            <div className="mt-4 text-sm">
              <span className="text-muted-foreground">Address:</span>
              <span className="ml-2">{contact.address}</span>
            </div>
          )}
          {contact.notes && (
            <div className="mt-4 text-sm">
              <span className="text-muted-foreground">Notes:</span>
              <p className="mt-1 text-muted-foreground">{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactions section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interactions</CardTitle>
            <InteractionForm
              contactId={contactId}
              authorId={MOCK_AUTHOR_ID}
              onSuccess={handleInteractionSuccess}
            />
          </div>
        </CardHeader>
        <CardContent>
          <InteractionTimeline key={timelineKey} contactId={contactId} />
        </CardContent>
      </Card>
    </div>
  )
}
