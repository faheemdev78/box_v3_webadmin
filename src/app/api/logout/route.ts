// https://nextjs.org/docs/app/api-reference/file-conventions/route

import type { NextRequest } from 'next/server'
// import { type NextRequest } from 'next/server'
// import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { COOKIE_ID } from '@_/configs'


export async function GET(request: NextRequest) {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_ID)

    try {
        cookieStore.clear()
    } catch (error) {
    }

    // redirect('https://nextjs.org/')

    return new Response('Success', {
        status: 200,
        // headers: { referer: referer },
    })

    // return Response.json({ message: 'Hello World' })

    // cookieStore.clear()

    // const a = cookieStore.get('a')
    // const b = cookieStore.set('b', '1')
    // const c = cookieStore.delete('c')
}



// export async function GET(request: Request) { }

// export async function HEAD(request: Request) { }

// export async function POST(request: Request) { }

// export async function PUT(request: Request) { }

// export async function DELETE(request: Request) { }

// export async function PATCH(request: Request) { }

// // If `OPTIONS` is not defined, Next.js will automatically implement `OPTIONS` and set the appropriate Response `Allow` header depending on the other methods defined in the Route Handler.
// export async function OPTIONS(request: Request) { }


