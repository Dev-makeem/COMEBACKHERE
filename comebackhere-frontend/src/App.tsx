import { useState, useCallback } from "react"
import { InvoicePayment } from "./components/InvoicePayment"
import { RefundRequest } from "./components/RefundRequest"
import { ComplianceManager } from "./components/ComplianceManager"
import { TokenAllowlist } from "./components/TokenAllowlist"
import { BatchExpireInvoices } from "./components/BatchExpireInvoices"
import { TreasuryManager } from "./components/TreasuryManager"
import { CreateInvoice } from "./components/CreateInvoice"
import { InvoiceList } from "./components/InvoiceList"
import { useInvoice } from "./hooks/useInvoice"
import { useTheme } from "./hooks/useTheme"
import { useWallet } from "./hooks/useWallet"
import { useHashTab, TABS, type Tab } from "./hooks/useHashTab"
import { CopyableText } from "./components/CopyableText"
import "./App.css"
import "./components/ErrorBoundary.css"

const TAB_LABELS: Record<Tab, string> = {
  payment: "Pay Invoice",
  create: "Create Invoice",
  invoices: "My Invoices",
  refund: "Request Refund",
  compliance: "Compliance",
  tokens: "Token Allowlist",
  "batch-expire": "Batch Expire",
  treasury: "Treasury",
}

function RefundTab() {
  const { invoice, loading, error, loadInvoice, refund } = useInvoice()
  const { address } = useWallet()
  const [invoiceId, setInvoiceId] = useState("")

  const handleLoadInvoice = async () => {
    await loadInvoice(Number(invoiceId))
  }

  return (
    <div className="refund-flow">
      <h2>Request a Refund</h2>

      <div className="invoice-lookup" role="search" aria-label="Invoice lookup">
        <label htmlFor="refund-invoice-id" className="sr-only">Invoice ID</label>
        <input
          id="refund-invoice-id"
          type="number"
          placeholder="Enter Invoice ID"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          aria-label="Invoice ID for refund lookup"
        />
        <button
          className="btn btn--primary"
          onClick={handleLoadInvoice}
          disabled={!invoiceId || loading}
          aria-label={loading ? "Loading invoice" : "Load invoice for refund"}
        >
          {loading ? "Loading..." : "Load Invoice"}
        </button>
      </div>

      {error && <div className="message message--error">{error}</div>}

      {invoice && (
        <div className="invoice-card">
          <div className="invoice-card__header">
            <h3>Invoice #<CopyableText text={String(invoice.id)} label="Copy invoice ID" /></h3>
          </div>
          <div className="invoice-card__body">
            <div className="detail-row">
              <span className="detail-label">Amount (USDC)</span>
              <span className="detail-value">{invoice.gross_usdc}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Merchant</span>
              <span className="detail-value detail-value--address">
                <CopyableText text={invoice.merchant} label="Copy merchant address" />
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Payer</span>
              <span className="detail-value detail-value--address">
                <CopyableText text={invoice.payer} label="Copy payer address" />
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span>{invoice.status}</span>
            </div>
          </div>
          <RefundRequest
            invoice={invoice}
            walletAddress={address}
            onRequestRefund={() => refund(address ?? "")}
          />
        </div>
      )}
    </div>
  )
}

interface TabContext {
  address: string | null
  setTab: (tab: Tab) => void
  openInvoice: (invoiceId: string) => void
}

function renderTab(tab: Tab, { address, setTab, openInvoice }: TabContext) {
  switch (tab) {
    case "payment":
      return <InvoicePayment />
    case "create":
      return <CreateInvoice merchantAddress={address} />
    case "invoices":
      return (
        <InvoiceList
          merchantAddress={address}
          onOpenInvoice={openInvoice}
          onCreateInvoice={() => setTab("create")}
        />
      )
    case "refund":
      return <RefundTab />
    case "tokens":
      return <TokenAllowlist />
    case "compliance":
      return <ComplianceManager />
    case "batch-expire":
      return <BatchExpireInvoices walletAddress={address} />
    case "treasury":
      return <TreasuryManager />
    default: {
      const unreachable: never = tab
      return unreachable
    }
  }
}

export default function App() {
  const { address, connected, connect, connecting, disconnect } = useWallet()
  useTheme()
  const [tab, setTab] = useHashTab()

  const handleDisconnect = useCallback(() => {
    disconnect()
    setTab("payment")
  }, [disconnect, setTab])

  // Open an invoice from the list in the payment tab. InvoicePayment loads
  // ?invoiceId= on mount, so the resulting URL is also shareable.
  const openInvoice = useCallback((invoiceId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set("invoiceId", invoiceId)
    window.history.replaceState(window.history.state, "", url)
    setTab("payment")
  }, [setTab])

  return (
    <div className="app">
      <header className="app-header" role="banner">
        <h1>ComebackHere</h1>
        <div className="wallet-bar">
          {connected ? (
            <>
              <span className="wallet-address" aria-label={`Wallet connected: ${address}`}>
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                className="btn btn--secondary btn--sm"
                onClick={handleDisconnect}
                aria-label="Disconnect wallet"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              className="btn btn--primary btn--sm"
              onClick={connect}
              disabled={connecting}
              aria-label="Connect wallet"
            >
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Main navigation">
        {TABS.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`tabpanel-${id}`}
            id={`tab-${id}`}
            className={`tab ${tab === id ? "tab--active" : ""}`}
            onClick={() => setTab(id)}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </nav>

      <main
        className="app-main"
        role="tabpanel"
        id={`tabpanel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {renderTab(tab, { address, setTab, openInvoice })}
      </main>
    </div>
  )
}
