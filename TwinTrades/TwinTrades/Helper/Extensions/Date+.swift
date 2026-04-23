import Foundation

extension Date {
    var isExpired: Bool { self < Date() }

    var shortDisplay: String { Formatters.date(self) }

    var relativeDisplay: String { Formatters.relativeDate(self) }
}
