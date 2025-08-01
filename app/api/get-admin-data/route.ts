import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Helper function to safely query a table
    const safeQuery = async (tableName: string, orderBy?: { column: string; ascending: boolean }) => {
      try {
        let query = supabase.from(tableName).select("*")

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending })
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error querying ${tableName}:`, error)
          return []
        }

        return data || []
      } catch (error) {
        console.error(`Exception querying ${tableName}:`, error)
        return []
      }
    }

    // Query all tables with individual error handling
    const [
      enginePackages,
      hullColors,
      upholsteryPackages,
      additionalOptions,
      boatModels,
      dealers,
      orders,
      serviceRequests,
      marketingContent,
      marketingManuals,
      marketingWarranties,
      factoryProduction,
    ] = await Promise.all([
      safeQuery("engine_packages", { column: "display_order", ascending: true }),
      safeQuery("hull_colors", { column: "display_order", ascending: true }),
      safeQuery("upholstery_packages", { column: "display_order", ascending: true }),
      safeQuery("additional_options", { column: "display_order", ascending: true }),
      safeQuery("boat_models", { column: "display_order", ascending: true }),
      safeQuery("dealers", { column: "display_order", ascending: true }),
      safeQuery("orders", { column: "created_at", ascending: false }),
      safeQuery("service_requests", { column: "created_at", ascending: false }),
      safeQuery("marketing_content", { column: "created_at", ascending: false }),
      safeQuery("marketing_manuals", { column: "display_order", ascending: true }),
      safeQuery("marketing_warranties", { column: "display_order", ascending: true }),
      safeQuery("factory_production", { column: "display_order", ascending: true }),
    ])

    // Clean up any potential JSON parsing issues in the data
    const cleanOrders = orders.map((order) => ({
      ...order,
      additional_options: Array.isArray(order.additional_options) ? order.additional_options : [],
    }))

    const cleanServiceRequests = serviceRequests.map((request) => ({
      ...request,
      issues: Array.isArray(request.issues) ? request.issues : [],
    }))

    const cleanFactoryProduction = factoryProduction.map((item) => ({
      ...item,
      additional_options: Array.isArray(item.additional_options) ? item.additional_options : [],
    }))

    return NextResponse.json({
      success: true,
      data: {
        enginePackages,
        hullColors,
        upholsteryPackages,
        additionalOptions,
        boatModels,
        dealers,
        orders: cleanOrders,
        serviceRequests: cleanServiceRequests,
        marketingContent,
        marketingManuals,
        marketingWarranties,
        factoryProduction: cleanFactoryProduction,
      },
    })
  } catch (error) {
    console.error("Error in get-admin-data:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
