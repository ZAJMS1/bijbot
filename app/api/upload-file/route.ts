import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = file.name
    const fileType = file.type
    const fileSize = file.size
    
    // Handle different file types
    if (fileType.startsWith('image/')) {
      // Handle images
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const dataUrl = `data:${fileType};base64,${base64}`
      
      return NextResponse.json({
        type: 'image',
        data: dataUrl,
        fileName,
        fileType,
        fileSize
      })
    } 
    else if (fileType === 'application/pdf') {
      // Handle PDFs
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const data = await pdf(buffer)
      
      return NextResponse.json({
        type: 'pdf',
        data: data.text,
        fileName,
        fileType,
        fileSize,
        pages: data.numpages,
        info: data.info
      })
    }
    else if (
      fileType.startsWith('text/') ||
      fileType === 'application/json' ||
      fileType === 'application/javascript' ||
      fileType === 'application/xml' ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileName.endsWith('.js') ||
      fileName.endsWith('.ts') ||
      fileName.endsWith('.tsx') ||
      fileName.endsWith('.jsx') ||
      fileName.endsWith('.py') ||
      fileName.endsWith('.java') ||
      fileName.endsWith('.cpp') ||
      fileName.endsWith('.c') ||
      fileName.endsWith('.h') ||
      fileName.endsWith('.css') ||
      fileName.endsWith('.html') ||
      fileName.endsWith('.xml') ||
      fileName.endsWith('.json') ||
      fileName.endsWith('.yaml') ||
      fileName.endsWith('.yml') ||
      fileName.endsWith('.sql') ||
      fileName.endsWith('.sh') ||
      fileName.endsWith('.bat') ||
      fileName.endsWith('.ps1') ||
      fileName.endsWith('.php') ||
      fileName.endsWith('.rb') ||
      fileName.endsWith('.go') ||
      fileName.endsWith('.rs') ||
      fileName.endsWith('.swift') ||
      fileName.endsWith('.kt') ||
      fileName.endsWith('.scala') ||
      fileName.endsWith('.r') ||
      fileName.endsWith('.m') ||
      fileName.endsWith('.dockerfile') ||
      fileName.toLowerCase() === 'dockerfile' ||
      fileName.toLowerCase() === 'makefile' ||
      fileName.toLowerCase() === 'readme' ||
      fileName.endsWith('.gitignore') ||
      fileName.endsWith('.env') ||
      fileName.endsWith('.config') ||
      fileName.endsWith('.conf')
    ) {
      // Handle text-based files
      const text = await file.text()
      
      return NextResponse.json({
        type: 'text',
        data: text,
        fileName,
        fileType,
        fileSize
      })
    }
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      // Handle Word documents (basic support)
      return NextResponse.json({
        type: 'document',
        data: `This is a Microsoft Word document: ${fileName}. Bijo can see the file but cannot read the content directly. Upload as PDF or text for full analysis.`,
        fileName,
        fileType,
        fileSize
      })
    }
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv')
    ) {
      // Handle spreadsheets
      if (fileName.endsWith('.csv')) {
        const text = await file.text()
        return NextResponse.json({
          type: 'csv',
          data: text,
          fileName,
          fileType,
          fileSize
        })
      } else {
        return NextResponse.json({
          type: 'spreadsheet',
          data: `This is a spreadsheet file: ${fileName}. Bijo can see the file but cannot read Excel files directly. Convert to CSV for full analysis.`,
          fileName,
          fileType,
          fileSize
        })
      }
    }
    else if (
      fileType.startsWith('audio/') ||
      fileName.endsWith('.mp3') ||
      fileName.endsWith('.wav') ||
      fileName.endsWith('.m4a') ||
      fileName.endsWith('.flac') ||
      fileName.endsWith('.ogg')
    ) {
      // Handle audio files
      return NextResponse.json({
        type: 'audio',
        data: `This is an audio file: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB). Bijo can see it's an audio file but cannot listen to it... yet. What do you think I am, some kind of fancy AI with ears?`,
        fileName,
        fileType,
        fileSize
      })
    }
    else if (
      fileType.startsWith('video/') ||
      fileName.endsWith('.mp4') ||
      fileName.endsWith('.avi') ||
      fileName.endsWith('.mov') ||
      fileName.endsWith('.mkv') ||
      fileName.endsWith('.webm')
    ) {
      // Handle video files
      return NextResponse.json({
        type: 'video',
        data: `This is a video file: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB). Bijo can see it's a video but cannot watch it. Are you stupid? I'm a text-based snake, not Netflix!`,
        fileName,
        fileType,
        fileSize
      })
    }
    else if (
      fileType === 'application/zip' ||
      fileType === 'application/x-rar-compressed' ||
      fileType === 'application/x-7z-compressed' ||
      fileName.endsWith('.zip') ||
      fileName.endsWith('.rar') ||
      fileName.endsWith('.7z') ||
      fileName.endsWith('.tar') ||
      fileName.endsWith('.gz')
    ) {
      // Handle archives
      return NextResponse.json({
        type: 'archive',
        data: `This is an archive file: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB). Oh for mil, you want me to extract this? I'm a snake, not WinRAR! Extract it yourself and upload the individual files.`,
        fileName,
        fileType,
        fileSize
      })
    }
    else {
      // Handle unknown/binary files
      const bytes = await file.arrayBuffer()
      const isLikelyBinary = checkIfBinary(new Uint8Array(bytes.slice(0, 1024)))
      
      if (!isLikelyBinary) {
        // Try to read as text
        try {
          const text = await file.text()
          return NextResponse.json({
            type: 'text',
            data: text,
            fileName,
            fileType: fileType || 'unknown',
            fileSize
          })
        } catch (e) {
          // Fall through to binary handling
        }
      }
      
      return NextResponse.json({
        type: 'binary',
        data: `This is a binary file: ${fileName} (${fileType || 'unknown type'}, ${(fileSize / 1024 / 1024).toFixed(2)} MB). What do you think I am doing, reading binary like some kind of computer wizard? Upload something I can actually examine, you stupid!`,
        fileName,
        fileType: fileType || 'unknown',
        fileSize
      })
    }

  } catch (error) {
    console.error('File processing error:', error)
    return NextResponse.json(
      { error: 'EHHH WHAT THE SHIT! Failed to process file. Are you trying to break me?' },
      { status: 500 }
    )
  }
}

// Helper function to detect binary files
function checkIfBinary(bytes: Uint8Array): boolean {
  // Check for null bytes or high percentage of non-printable characters
  let nonPrintable = 0
  for (let i = 0; i < Math.min(bytes.length, 1024); i++) {
    const byte = bytes[i]
    if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      nonPrintable++
    }
  }
  return nonPrintable / Math.min(bytes.length, 1024) > 0.3
}