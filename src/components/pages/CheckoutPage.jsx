import React from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useShop } from "@/context/ShopContext"

const shippingFields = [
  { label: "Full name", name: "fullName", placeholder: "Priya Kapoor" },
  { label: "Email address", name: "email", placeholder: "hello@marvelle.com", type: "email" },
  { label: "Phone number", name: "phone", placeholder: "+91 98765 43210", type: "tel" },
  {
    label: "Shipping address",
    name: "address",
    placeholder: "Level 3, Cevonne House, 12m Avenue",
    colSpan: 2,
  },
  { label: "City / Town", name: "city", placeholder: "Mumbai" },
  { label: "Postal code", name: "postalCode", placeholder: "400001" },
]

const paymentOptions = [
  {
    label: "Credit or Debit Card",
    description: "Visa, Mastercard, and RuPay accepted immediately.",
    value: "card",
  },
  {
    label: "Net banking & UPI",
    description: "Pay through UPI or your preferred bank.",
    value: "upi",
  },
  {
    label: "Cash on delivery",
    description: "Pay when we handover your parcel at the door.",
    value: "cod",
  },
]

const formatMoney = (value) =>
  Number.isFinite(value) ? value.toLocaleString("en-IN") : "0"

export default function CheckoutPage() {
  const { cartItems } = useShop()
  const subtotal = cartItems.reduce((sum, item) => {
    const value = Number(item.price)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0)
  const currencySymbol = cartItems[0]?.currency || "₹"
  const shippingFee = cartItems.length ? 149 : 0
  const total = subtotal + shippingFee

  return (
    <div className="min-h-screen bg-[var(--accent)] text-[var(--primary)]">
      <div className="w-full px-4 pt-24 pb-10 lg:pt-32 lg:pb-16">
        <header className="mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-[var(--secondary-300)] text-[var(--secondary-foreground)] uppercase tracking-widest">
              Secure Checkout
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--primary)]">Complete your order</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Fill in the shipping details and choose your preferred payment method.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="space-y-8">
            {/* Shipping Details */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-[var(--primary)]">Shipping Details</h2>
              <form className="grid gap-4 md:grid-cols-2">
                {shippingFields.map((field) => (
                  <div
                    key={field.name}
                    className={field.colSpan === 2 ? "md:col-span-2" : "md:col-span-1"}
                  >
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--accent)] px-4 py-2.5 text-sm text-[var(--primary)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:bg-[var(--card)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    />
                  </div>
                ))}
              </form>
            </div>

            {/* Payment Method */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-[var(--primary)]">Payment Method</h2>
              <div className="space-y-3">
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-4 rounded-xl border border-[var(--border)] p-4 transition-all hover:border-[var(--secondary-300)] hover:bg-[var(--accent)] has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--accent)]"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      defaultChecked={option.value === "card"}
                      className="mt-1 h-4 w-4 border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-[var(--primary)]">{option.label}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Order Summary */}
          <section className="h-fit space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--primary)]">Order Summary</h2>

            <ul className="space-y-3 border-b border-[var(--border)] pb-4">
              {cartItems.length ? (
                cartItems.map((item) => {
                  const itemPrice = Number(item.price)
                  const priceLabel = Number.isFinite(itemPrice)
                    ? formatMoney(itemPrice)
                    : "0"
                  return (
                    <li key={item.key} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--muted-foreground)]">{item.name}</span>
                      <span className="text-[var(--primary)]">
                        {item.currency || currencySymbol}
                        {priceLabel}
                      </span>
                    </li>
                  )
                })
              ) : (
                <li className="text-sm text-[var(--muted-foreground)] italic">
                  Your cart is empty.
                </li>
              )}
            </ul>

            <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{currencySymbol}{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{currencySymbol}{formatMoney(shippingFee)}</span>
              </div>
              <div className="border-t border-[var(--border)] pt-4 flex items-center justify-between text-base font-bold text-[var(--primary)]">
                <span>Total</span>
                <span>{currencySymbol}{formatMoney(total)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button className="w-full rounded-full bg-[var(--primary)] py-6 text-sm font-bold uppercase tracking-widest text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/20 hover:bg-[var(--primary-700)] hover:shadow-xl transition-all">
                Place Order
              </Button>
              <Link to="/cart" className="block text-center text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:underline">
                Back to cart
              </Link>
            </div>

            <p className="text-center text-[10px] text-[var(--muted-foreground)]">
              By placing an order, you agree to our terms & conditions.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
