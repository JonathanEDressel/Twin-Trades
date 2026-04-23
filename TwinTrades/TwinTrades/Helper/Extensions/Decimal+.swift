import Foundation

extension Decimal {
    /// Format as a USD currency string. Never use Double for money.
    var currencyDisplay: String { Formatters.currency(self) }

    /// Format as a percentage string (e.g. "12.34%").
    var percentDisplay: String { Formatters.percent(self) }

    /// Returns the sign (+/-) prefix for a return value.
    var signedDisplay: String {
        let prefix = self >= 0 ? "+" : ""
        return "\(prefix)\(Formatters.percent(self))"
    }
}
