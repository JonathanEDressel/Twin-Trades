import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case forbidden
    case notFound
    case server(status: Int, data: Data)
    case decoding(Error)
    case network(Error)
    case tokenMissing
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidURL:       return "Invalid request URL."
        case .invalidResponse:  return "Unexpected server response."
        case .unauthorized:     return "Session expired. Please sign in again."
        case .forbidden:        return "You do not have permission to perform this action."
        case .notFound:         return "The requested resource was not found."
        case .server(let status, let data):
            if let body = try? JSONDecoder.apiDecoder.decode(APIErrorBody.self, from: data) {
                return body.detail
            }
            return "Server error (\(status))."
        case .decoding(let err): return "Data parsing failed: \(err.localizedDescription)"
        case .network(let err):  return "Network error: \(err.localizedDescription)"
        case .tokenMissing:     return "Authentication token is missing."
        case .unknown:          return "An unexpected error occurred."
        }
    }
}

struct APIErrorBody: Decodable {
    let detail: String
}

extension JSONDecoder {
    static var apiDecoder: JSONDecoder {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }
}

extension JSONEncoder {
    static var apiEncoder: JSONEncoder {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase
        e.dateEncodingStrategy = .iso8601
        return e
    }
}
