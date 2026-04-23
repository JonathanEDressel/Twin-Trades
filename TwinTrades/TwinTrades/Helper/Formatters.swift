import Foundation

enum Formatters {

    private static let currencyFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = 2
        return f
    }()

    private static let percentFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .percent
        f.maximumFractionDigits = 2
        f.multiplier = 1
        return f
    }()

    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .none
        return f
    }()

    private static let relativeDateFormatter = RelativeDateTimeFormatter()

    static func currency(_ value: Decimal) -> String {
        currencyFormatter.string(from: value as NSDecimalNumber) ?? "$0.00"
    }

    static func percent(_ value: Decimal) -> String {
        percentFormatter.string(from: value as NSDecimalNumber) ?? "0%"
    }

    static func date(_ date: Date) -> String {
        dateFormatter.string(from: date)
    }

    static func relativeDate(_ date: Date) -> String {
        relativeDateFormatter.localizedString(for: date, relativeTo: Date())
    }

    static func ticker(_ symbol: String) -> String {
        symbol.uppercased()
    }
}
