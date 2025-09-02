import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { RefreshCw, Monitor } from "lucide-react"
import SystemMonitor from "../components/SystemMonitor";


const Dashboard = () => {
    const [lastUpdated, setLastUpdated] = useState(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)


    const refreshData = () => {
        setIsRefreshing(true)
        setTimeout(() => {
            setLastUpdated(new Date())
            setIsRefreshing(false)
        }, 1000)
    }

    useEffect(() => {
        const interval = setInterval(refreshData, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card shadow-lg">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Monitor className="h-8 w-8 text-accent" />
                            <h1 className="text-2xl font-bold text-foreground">System Monitor</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                                <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
                                All systems operational
                            </div>
                            <div className="text-sm text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</div>
                            <Button
                                onClick={refreshData}
                                disabled={isRefreshing}
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-transparent hover:bg-accent/10"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* System Monitor */}
            <SystemMonitor />
        </div>
    )
}

export default Dashboard


