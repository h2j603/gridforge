# GridForge — v1 스펙

> Web↔Print 양방향 그리드 디자인 도구. ck-ref의 GridMaker에서 분기한 단독 도구.
> 1인 사용 (혁), 인증 없음, Supabase 기반, Next.js + Tailwind + Radix.

---

## 0. 요약

**무엇을 하는 도구인가**

InDesign 페이지 설정 + Müller-Brockmann 그리드 + 슬롯 정의를 한 화면에서 짜고, **SVG / PNG / CSS** 세 가지로 출력. 같은 그리드 스펙으로 인쇄용 산출물과 웹용 코드를 동시에 뽑는다. 그리드는 갤러리에 저장하고 다른 캔버스/문서에 재사용(계보 추적).

**핵심 결정 (요약)**

- 좌표는 모두 **0–1 fraction** (canvas 또는 spread 기준)
- **Document → Spread → Page → Grid → Slot** 4단 모델
- **Facing pages, bleed, baseline grid 전부 지원** (slug는 v2)
- 그리드는 **셀 스냅 디폴트, Alt로 자유 배치**
- 출력은 클라이언트 사이드, **반응형 CSS는 자동 환원**
- **계보**: Document 단위 + Grid 단위 둘 다 추적
- 데이터는 **정규화 테이블** + Supabase

> Full spec lives in this file's git history alongside the original handoff. The TypeScript types live in `lib/types.ts` and the DDL in `db/schema.sql` — those are the canonical sources for v1 implementation. Refer to those plus the section structure below when implementing later milestones (v0.2 onwards).

## Section index (high level)

1. Domain model — see `lib/types.ts`
2. Database schema — see `db/schema.sql`
3. Routes — `/`, `/new`, `/d/[id]`, `/d/[id]/spread/[index]`, `/gallery`, `/gallery/grids`, `/d/[id]/export`
4. Component tree — `components/editor/*` (EditorShell, Canvas, PageBoard, layers, panels, dialogs, hooks)
5. SVG / PNG / CSS exporters — `lib/exporters/{svg,png,css}.ts` (v0.9)
6. UX notes — grid change → slot fallback dialog, snapping, rulers, keyboard shortcuts
7. Build order — v0.1 skeleton → v0.2 single page editor → v0.3 slots → v0.4 baseline + custom grid → v0.5 multi-spread + facing → v0.6 typography → v0.7 reference image → v0.8 undo + shortcuts → v0.9 export → v1.0 gallery + lineage → v1.5 polish → v2 print-to-web wizard
8. Migration notes from ck-ref GridMaker — do not copy `GridAnalyzer.tsx` wholesale; component responsibility is inverted (grid is root, image is optional reference)
9. File index — see directory layout
10. Handoff checklist — start with v0.1, then verify build before moving on

## v0.1 — what's in this commit

- Next.js 16 (async params) + Tailwind 4 (CSS-first config) + Radix primitives
- `lib/types.ts` per §1.1
- `db/schema.sql` per §2.1
- Supabase server/client wiring
- `/new` form → server action → `createDocument()` → redirect to `/d/[id]`
- Editor shell with placeholder panels and stubbed layer files
- Gallery placeholders

## Next: v0.2

Implement single-page editor: real GridLayer SVG rendering, RulerOverlay, working Page/Margins/Grid panels with optimistic updates through `useDocument`.
