import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split(".").pop() || "jpg"
    const filename = `marketing-content/${timestamp}-${randomString}.${fileExtension}`

    try {
      // Upload to Vercel Blob with retry logic
      const blob = await put(filename, file, {
        access: "public",
      })

      return NextResponse.json({
        success: true,
        url: blob.url,
        filename: filename,
      })
    } catch (blobError: any) {
      console.error("Vercel Blob error:", blobError)

      // Handle specific Vercel Blob errors
      if (blobError.message?.includes("rate limit") || blobError.message?.includes("Too Many")) {
        return NextResponse.json(
          {
            success: false,
            error: "Upload rate limit exceeded. Please wait a moment and try again.",
          },
          { status: 429 },
        )
      }

      if (blobError.message?.includes("quota") || blobError.message?.includes("storage")) {
        return NextResponse.json(
          {
            success: false,
            error: "Storage quota exceeded. Please contact administrator.",
          },
          { status: 507 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: `Upload failed: ${blobError.message || "Unknown error"}`,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error.message || "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
