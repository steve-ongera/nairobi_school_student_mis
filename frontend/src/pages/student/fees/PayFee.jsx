import { useState, useEffect } from "react";
import { getMyInvoices, initiateStkPush } from "../../../utils/api";
import { formatCurrency } from "../../../utils/formatters";
import { PageTitle, AlertMessage } from "../../../components/common";

export default function PayFee() {
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({
    phone_number: "",
    amount: "",
    invoice_id: "",
    admission_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [checkoutId, setCheckoutId] = useState("");

  useEffect(() => {
    getMyInvoices()
      .then((r) => {
        const unpaid = r.data.filter((inv) => inv.status !== "paid");
        setInvoices(unpaid);
        if (unpaid.length === 1) {
          setForm((f) => ({
            ...f,
            invoice_id: unpaid[0].id,
            amount: unpaid[0].balance,
            admission_number: unpaid[0].admission_number,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const selectedInvoice = invoices.find((inv) => inv.id === parseInt(form.invoice_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });
    setCheckoutId("");
    try {
      const { data } = await initiateStkPush({
        phone_number: form.phone_number,
        amount: parseFloat(form.amount),
        admission_number: form.admission_number,
        invoice_id: parseInt(form.invoice_id),
      });
      setCheckoutId(data.checkout_request_id);
      setMsg({
        type: "success",
        text: "STK Push sent! Check your phone for the MPESA prompt.",
      });
    } catch (err) {
      setMsg({
        type: "danger",
        text: err.response?.data?.detail || "Failed to initiate payment.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Pay via MPESA"
        breadcrumbs={[{ label: "Fees" }, { label: "Pay" }]}
      />

      <div className="row justify-content-center">
        <div className="col-lg-6">
          <AlertMessage
            type={msg.type}
            message={msg.text}
            onClose={() => setMsg({ type: "", text: "" })}
          />

          {checkoutId && (
            <div className="alert alert-info d-flex align-items-center gap-2">
              <i className="bi bi-phone-vibrate fs-4" />
              <div>
                <strong>Awaiting payment…</strong>
                <br />
                <small>
                  Checkout ID: <code>{checkoutId}</code>
                </small>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <div className="text-center mb-4">
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: "#e0f8e9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <i className="bi bi-phone" style={{ fontSize: 32, color: "#2eca6a" }} />
                </div>
                <h5 className="card-title mb-0">MPESA School Fees Payment</h5>
                <small className="text-muted">Lipa na MPESA – STK Push</small>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Invoice selector */}
                <div className="mb-3">
                  <label className="form-label fw-600">Select Invoice</label>
                  <select
                    className="form-select"
                    value={form.invoice_id}
                    onChange={(e) => {
                      const inv = invoices.find((i) => i.id === parseInt(e.target.value));
                      setForm((f) => ({
                        ...f,
                        invoice_id: e.target.value,
                        amount: inv?.balance || "",
                        admission_number: inv?.admission_number || "",
                      }));
                    }}
                    required
                  >
                    <option value="">— Select an invoice —</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.term_display} – Balance: {formatCurrency(inv.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invoice summary */}
                {selectedInvoice && (
                  <div
                    className="rounded p-3 mb-3"
                    style={{ background: "#f6f9ff", border: "1px solid #ebeef4" }}
                  >
                    <div className="row text-center">
                      {[
                        { label: "Total", value: formatCurrency(selectedInvoice.total_amount) },
                        { label: "Paid", value: formatCurrency(selectedInvoice.amount_paid) },
                        {
                          label: "Balance",
                          value: formatCurrency(selectedInvoice.balance),
                          bold: true,
                          color: "danger",
                        },
                      ].map((item) => (
                        <div key={item.label} className="col-4">
                          <div
                            className={`fw-${item.bold ? "700" : "500"} text-${item.color || "dark"}`}
                            style={{ fontSize: item.bold ? 18 : 15 }}
                          >
                            {item.value}
                          </div>
                          <small className="text-muted">{item.label}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phone */}
                <div className="mb-3">
                  <label className="form-label fw-600">MPESA Phone Number</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-phone" />
                    </span>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="0712 345 678"
                      value={form.phone_number}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone_number: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <small className="text-muted">Format: 0712345678 or 254712345678</small>
                </div>

                {/* Amount */}
                <div className="mb-4">
                  <label className="form-label fw-600">Amount (KES)</label>
                  <div className="input-group">
                    <span className="input-group-text fw-700">KES</span>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      value={form.amount}
                      min={1}
                      step={1}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, amount: e.target.value }))
                      }
                      required
                    />
                  </div>
                  {selectedInvoice && parseFloat(form.amount) > parseFloat(selectedInvoice.balance) && (
                    <small className="text-warning">
                      <i className="bi bi-exclamation-triangle me-1" />
                      Amount exceeds invoice balance.
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Sending STK Push…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-phone-fill me-2" />
                      Pay {form.amount ? formatCurrency(form.amount) : ""} via MPESA
                    </>
                  )}
                </button>
              </form>

              <div className="mt-3 text-center">
                <small className="text-muted">
                  <i className="bi bi-shield-check me-1 text-success" />
                  Secured by Safaricom Daraja API
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}