import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabaseAdmin = createServerClient()
    console.log("🗑️ Limpando dados das tabelas...")

    // Ordem de limpeza (respeitando foreign keys)
    const tables = [
      "service_requests",
      "orders",
      "dealers",
      "boat_models",
      "additional_options",
      "hull_colors",
      "engine_packages",
    ]

    const results = []

    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin.from(table).delete().neq("id", 0)

        if (error) {
          console.error(`❌ Erro ao limpar ${table}:`, error)
          results.push(`${table}: Erro - ${error.message}`)
        } else {
          console.log(`✅ Tabela ${table} limpa`)
          results.push(`${table}: Limpa`)
        }
      } catch (err) {
        console.error(`❌ Erro inesperado em ${table}:`, err)
        results.push(`${table}: Erro inesperado`)
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Dados limpos com sucesso",
      results,
    })
  } catch (error) {
    console.error("❌ Erro geral ao limpar dados:", error)
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
