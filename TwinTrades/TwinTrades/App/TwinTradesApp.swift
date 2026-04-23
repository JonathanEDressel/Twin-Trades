import SwiftUI

@main
struct TwinTradesApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var coordinator = AppCoordinator()

    var body: some Scene {
        WindowGroup {
            Group {
                switch coordinator.root {
                case .unauthenticated:
                    // Show the LoginView as the unauthenticated root.
                    // The LoginView's ViewModel posts .didAuthenticate on success, which
                    // the AppCoordinator observes to transition root to .authenticated.
                    LoginView()
                case .forceChangePassword:
                    // Show the ChangePasswordView when the server indicates must_change_password.
                    // After a successful change the session is refreshed and root transitions to .authenticated.
                    ChangePasswordView()
                case .authenticated:
                    // Show the main TabView with Dashboard, Marketplace, Trade History, and Settings tabs.
                    // Admin users additionally see an Admin tab gated by user.role check.
                    MainTabView(user: coordinator.currentUser)
                }
            }
            .environment(coordinator)
            .task { await coordinator.resolveInitialRoot() }
            .onOpenURL { url in coordinator.handleDeepLink(url) }
        }
    }
}

// MARK: - Main Tab View

struct MainTabView: View {
    let user: User?

    var body: some View {
        // TabView with four primary tabs: Dashboard, Marketplace, Trades, Settings.
        // When user.role is .admin or .ultimate_admin, append an Admin tab before Settings.
        // Each tab root is wrapped in a NavigationStack for push navigation within the tab.
        TabView {
            NavigationStack { DashboardView() }
                .tabItem { Label("Dashboard", systemImage: "chart.pie.fill") }

            NavigationStack { MarketplaceView() }
                .tabItem { Label("Marketplace", systemImage: "globe") }

            NavigationStack { TradeHistoryView() }
                .tabItem { Label("Trades", systemImage: "arrow.left.arrow.right") }

            if let role = user?.role, role == .admin || role == .ultimate_admin {
                NavigationStack { AdminDashboardView() }
                    .tabItem { Label("Admin", systemImage: "shield.fill") }
            }

            NavigationStack { SettingsView() }
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(DesignTokens.Colors.accent)
    }
}
