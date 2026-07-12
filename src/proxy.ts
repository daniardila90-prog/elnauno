import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/seleccion/admin");
  const isLoginRoute = request.nextUrl.pathname === "/seleccion/admin/login";

  if (isAdminRoute && !isLoginRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/seleccion/admin/login";
      return NextResponse.redirect(url);
    }

    const { data: adminRow } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/seleccion/admin/login";
      url.searchParams.set("error", "not_admin");
      return NextResponse.redirect(url);
    }
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/seleccion/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/seleccion/admin/:path*"],
};
