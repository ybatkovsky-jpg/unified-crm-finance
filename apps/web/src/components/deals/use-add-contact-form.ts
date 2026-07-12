"use client"

/**
 * useAddContactForm — состояние сложной формы добавления контактов в сделку.
 *
 * Два режима:
 * - 'individual': одно физлицо с паспортом
 * - 'company': организация + N сотрудников (динамические строки)
 *
 * Жёсткая типизация: все поля соответствуют DTO из deal-contacts-dto.ts.
 * Никаких any.
 */

import { useState, useCallback } from "react"
import type {
  AddContactDto,
  AddIndividualDto,
  AddCompanyWithEmployeesDto,
  PersonContactFields,
  CompanyFields,
  EmployeeRow,
  PassportData,
} from "@/lib/api/deal-contacts-dto"
import {
  EMPTY_PERSON,
  EMPTY_COMPANY,
  EMPTY_PASSPORT,
} from "@/lib/api/deal-contacts-dto"

type FormMode = "individual" | "company"

let tempIdCounter = 0
function nextTempId(): string {
  tempIdCounter += 1
  return `emp-${Date.now()}-${tempIdCounter}`
}

export function useAddContactForm() {
  const [mode, setMode] = useState<FormMode>("individual")

  // Individual state
  const [person, setPerson] = useState<PersonContactFields>({ ...EMPTY_PERSON })
  const [personRole, setPersonRole] = useState<string>("Заказчик")

  // Company state
  const [company, setCompany] = useState<CompanyFields>({ ...EMPTY_COMPANY })
  const [companyRole, setCompanyRole] = useState<string>("Заказчик")
  const [employees, setEmployees] = useState<EmployeeRow[]>([])

  // ── Person field updater (individual mode) ──
  const updatePerson = useCallback(
    <K extends keyof PersonContactFields>(key: K, value: PersonContactFields[K]) => {
      setPerson((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  // ── Passport field updater ──
  const updatePassport = useCallback(
    <K extends keyof PassportData>(key: K, value: PassportData[K]) => {
      setPerson((prev) => ({
        ...prev,
        passport: { ...prev.passport, [key]: value },
      }))
    },
    [],
  )

  // ── Company field updater ──
  const updateCompany = useCallback(
    <K extends keyof CompanyFields>(key: K, value: CompanyFields[K]) => {
      setCompany((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  // ── Employee CRUD (company mode) ──
  const addEmployee = useCallback(() => {
    setEmployees((prev) => [
      ...prev,
      {
        tempId: nextTempId(),
        person: { ...EMPTY_PERSON, passport: { ...EMPTY_PASSPORT } },
        role: "designer",
      },
    ])
  }, [])

  const removeEmployee = useCallback((tempId: string) => {
    setEmployees((prev) => prev.filter((e) => e.tempId !== tempId))
  }, [])

  const updateEmployee = useCallback(
    (
      tempId: string,
      updater: (row: EmployeeRow) => EmployeeRow,
    ) => {
      setEmployees((prev) =>
        prev.map((e) => (e.tempId === tempId ? updater(e) : e)),
      )
    },
    [],
  )

  /** Обновить поле сотрудника (person или role). */
  const updateEmployeePerson = useCallback(
    <K extends keyof PersonContactFields>(
      tempId: string,
      key: K,
      value: PersonContactFields[K],
    ) => {
      updateEmployee(tempId, (row) => ({
        ...row,
        person: { ...row.person, [key]: value },
      }))
    },
    [updateEmployee],
  )

  const updateEmployeePassport = useCallback(
    <K extends keyof PassportData>(
      tempId: string,
      key: K,
      value: PassportData[K],
    ) => {
      updateEmployee(tempId, (row) => ({
        ...row,
        person: {
          ...row.person,
          passport: { ...row.person.passport, [key]: value },
        },
      }))
    },
    [updateEmployee],
  )

  const updateEmployeeRole = useCallback(
    (tempId: string, role: string) => {
      updateEmployee(tempId, (row) => ({ ...row, role }))
    },
    [updateEmployee],
  )

  // ── Reset ──
  const reset = useCallback(() => {
    setMode("individual")
    setPerson({ ...EMPTY_PERSON, passport: { ...EMPTY_PASSPORT } })
    setPersonRole("customer")
    setCompany({ ...EMPTY_COMPANY })
    setCompanyRole("customer")
    setEmployees([])
  }, [])

  // ── Build DTO for submission ──
  const buildDto = useCallback((): AddContactDto | null => {
    if (mode === "individual") {
      if (!person.firstName.trim()) return null
      const dto: AddIndividualDto = {
        mode: "individual",
        person,
        role: personRole,
      }
      return dto
    }

    // company mode
    if (!company.companyName.trim()) return null
    const dto: AddCompanyWithEmployeesDto = {
      mode: "company",
      company,
      companyRole,
      employees: employees.filter((e) => e.person.firstName.trim()),
    }
    return dto
  }, [mode, person, personRole, company, companyRole, employees])

  return {
    // state
    mode,
    person,
    personRole,
    company,
    companyRole,
    employees,

    // mode switch
    setMode,

    // individual updaters
    updatePerson,
    updatePassport,
    setPersonRole,

    // company updaters
    updateCompany,
    setCompanyRole,

    // employee updaters
    addEmployee,
    removeEmployee,
    updateEmployeePerson,
    updateEmployeePassport,
    updateEmployeeRole,

    // lifecycle
    reset,
    buildDto,
  }
}

export type UseAddContactForm = ReturnType<typeof useAddContactForm>
