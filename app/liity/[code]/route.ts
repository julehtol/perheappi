import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { blocked, clientIp, recordFailure } from "@/lib/ratelimit";
import { setFamilyCookie } from "@/lib/session";

/** Kutsulinkki: /liity/KOODI muistaa perheen ja vie profiilin valintaan. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ipKey = [`join:${await clientIp()}`];
  if (await blocked(ipKey)) return NextResponse.redirect(new URL("/aloitus?virhe=raja", req.url));
  const sql = await db();
  const [family] = await sql<{ id: number }[]>`
    SELECT id FROM families WHERE invite_code = ${code.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
  if (!family) {
    await recordFailure(ipKey);
    return NextResponse.redirect(new URL("/aloitus?virhe=koodi", req.url));
  }
  await setFamilyCookie(family.id);
  return NextResponse.redirect(new URL("/aloitus", req.url));
}
