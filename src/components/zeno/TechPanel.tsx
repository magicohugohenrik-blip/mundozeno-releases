import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  appVersion,
  flushQueue,
  getDeviceCode,
  pendingCount,
  setDeviceCode,
} from "@/lib/session-sync";
import { enterKiosk, exitKiosk, kioskEnabled, setKioskPin } from "@/lib/kiosk";
import {
  canShutdown,
  checkForUpdates,
  getAutoLaunch,
  isDesktop,
  quitApp,
  setAutoLaunch,
  setNativeKiosk,
  shutdownComputer,
} from "@/lib/desktop";
import { useI18n, useT } from "@/lib/i18n";
import { localPoint } from "@/lib/pointer";
import { localReports, type LocalStudentReport } from "@/lib/local-report";
import { skillLabels, type SkillId } from "@/lib/skills";

interface DeviceInfo {
  status: string;
  label: string | null;
  location: string | null;
  last_sync_at: string | null;
  organization_id: string | null;
}

/** Área técnica da mesa (Fase 6): identificação, sincronização e modo quiosque. */
export function TechPanel({ online, onClose }: { online: boolean; onClose: () => void }) {
  const t = useT();
  const { lang } = useI18n();
  const [reports, setReports] = useState<LocalStudentReport[]>([]);
  const skillName = (id: string) =>
    skillLabels[lang]?.[id as SkillId] ?? skillLabels.pt[id as SkillId] ?? id;
  const [code, setCode] = useState(() => getDeviceCode());
  const [input, setInput] = useState("");
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(() => pendingCount());
  const [kiosk, setKiosk] = useState(() => kioskEnabled());
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const desktop = isDesktop();
  const [autoStart, setAutoStart] = useState(false);
  const [checking, setChecking] = useState(false);
  const [touchPoints, setTouchPoints] = useState(0);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[]>([]);
  const [confirmOff, setConfirmOff] = useState(false);
  const [shuttingDown, setShuttingDown] = useState(false);

  useEffect(() => {
    if (desktop) void getAutoLaunch().then(setAutoStart);
  }, [desktop]);

  async function toggleAutoStart() {
    const next = await setAutoLaunch(!autoStart);
    setAutoStart(next);
    toast.success(next ? t("tech.autoStartOn") : t("tech.autoStartOff"));
  }

  async function update() {
    setChecking(true);
    toast.info(t("tech.updateChecking"));
    const res = await checkForUpdates(appVersion());
    setChecking(false);
    toast.success(res.available ? t("tech.updateFound") : t("tech.updateNone"));
    if (res.available && !desktop) window.location.reload();
  }

  /** Desligamento seguro: salva tudo, fecha o app e pede desligamento normal ao Windows. */
  async function shutdown() {
    setShuttingDown(true);
    toast.info(t("tech.shutdownSaving"));
    // Avisa os jogos abertos para gravarem a partida em andamento.
    window.dispatchEvent(new CustomEvent("zeno:will-shutdown"));
    await new Promise((r) => setTimeout(r, 400));
    const left = await flushQueue();
    setPending(left);
    toast.success(t("tech.shutdownGoing"));
    const res = await shutdownComputer();
    if (!res.ok) {
      setShuttingDown(false);
      setConfirmOff(false);
      toast.error(t("tech.shutdownFail"));
    }
  }

  function trackTouch(e: React.PointerEvent<HTMLDivElement>) {
    const p = localPoint(e.currentTarget, e.clientX, e.clientY);
    setStrokes((prev) => [...prev.slice(-400), p]);
    setTouchPoints((n) => n + 1);
  }

  const loadInfo = useCallback(async () => {
    const { data } = await supabase
      .from("devices")
      .select("status, label, location, last_sync_at, organization_id")
      .eq("code", code)
      .maybeSingle();
    setInfo((data as DeviceInfo | null) ?? null);
  }, [code]);

  useEffect(() => {
    void loadInfo();
  }, [loadInfo]);

  // Relatório simplificado calculado na própria mesa (funciona off-line).
  useEffect(() => {
    setReports(localReports(30));
  }, []);

  async function sync() {
    const left = await flushQueue();
    setPending(left);
    await loadInfo();
    toast.success(left === 0 ? t("tech.syncDone") : t("tech.syncPartial", { count: left }));
  }

  function activate() {
    const clean = input.trim().toUpperCase();
    if (clean.length < 4) return;
    setCode(setDeviceCode(clean));
    setInput("");
    toast.success(t("tech.activated"));
  }

  async function toggleKiosk() {
    if (kiosk) {
      const ok = await exitKiosk(pin);
      if (!ok) {
        toast.error(t("tech.wrongPin"));
        return;
      }
      setKiosk(false);
      setPin("");
      if (desktop) await setNativeKiosk(false);
      toast.success(t("tech.kioskOff"));
      return;
    }
    await enterKiosk();
    if (desktop) await setNativeKiosk(true);
    setKiosk(true);
    toast.success(t("tech.kioskOn"));
  }

  function savePin() {
    if (pin.replace(/\D/g, "").length < 4) {
      toast.error(t("tech.pinRule"));
      return;
    }
    setKioskPin(pin);
    setPin("");
    toast.success(t("tech.pinSaved"));
  }

  const statusKey =
    info?.status === "active"
      ? "tech.statusActive"
      : info?.status === "blocked"
        ? "tech.statusBlocked"
        : "tech.statusPending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">🔧 {t("tech.title")}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold"
          >
            {t("tech.close")}
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Item label={t("tech.device")} value={code} mono />
          <Item label={t("tech.status")} value={t(statusKey as "tech.statusActive")} />
          <Item label={t("tech.version")} value={appVersion()} />
          <Item
            label={t("tech.connection")}
            value={online ? t("tech.online") : t("tech.offline")}
          />
          <Item label={t("tech.pending")} value={String(pending)} />
          <Item
            label={t("tech.lastSync")}
            value={info?.last_sync_at ? new Date(info.last_sync_at).toLocaleString() : "—"}
          />
          <Item label={t("tech.place")} value={info?.location || info?.label || "—"} />
          <Item
            label={t("tech.linked")}
            value={info?.organization_id ? t("tech.yes") : t("tech.no")}
          />
        </dl>

        <button
          onClick={() => void sync()}
          disabled={!online}
          className="mt-4 w-full rounded-2xl bg-zeno-blue px-4 py-3 font-display text-lg text-white disabled:opacity-50"
        >
          🔄 {t("tech.sync")}
        </button>

        <section className="mt-4 rounded-2xl border border-border p-4">
          <h3 className="font-display text-lg">{t("tech.localTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("tech.localHint")}</p>
          {reports.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("tech.localEmpty")}</p>
          ) : (
            <div className="mt-3 space-y-3">
              {reports.map((r) => (
                <div key={r.studentId} className="rounded-xl bg-secondary/60 p-3 text-sm">
                  <p className="font-display text-base">{r.name || t("tech.localChild")}</p>
                  <p className="text-muted-foreground">
                    {t("tech.localLine", {
                      sessions: r.sessions,
                      games: r.games,
                      accuracy: r.accuracy,
                      duration: r.avgDurationSeconds,
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {t("tech.localResponse", {
                      response: r.avgResponseSeconds === null ? "—" : `${r.avgResponseSeconds}s`,
                      hints: r.hints,
                    })}
                  </p>
                  {r.bySkill.length > 0 && (
                    <p className="mt-1 text-muted-foreground">
                      {r.bySkill
                        .slice(0, 4)
                        .map((s) => `${skillName(s.skill)}: ${s.accuracy}%`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              ))}
              <button
                onClick={() => window.print()}
                className="w-full rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                🖨️ {t("tech.localPrint")}
              </button>
            </div>
          )}
        </section>


        <section className="mt-5 rounded-2xl border border-border p-4">
          <h3 className="font-display text-lg">{t("tech.activateTitle")}</h3>
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="MESA-XXXX-XXXX"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm uppercase"
            />
            <button
              onClick={activate}
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold"
            >
              {t("tech.activate")}
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-border p-4">
          <h3 className="font-display text-lg">{t("tech.kioskTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("tech.kioskHint")}</p>
          <div className="mt-2 flex gap-2">
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              placeholder={t("tech.pin")}
              className="w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={() => void toggleKiosk()}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${kiosk ? "bg-zeno-orange" : "bg-zeno-blue"}`}
            >
              {kiosk ? t("tech.kioskExit") : t("tech.kioskEnter")}
            </button>
            <button
              onClick={savePin}
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold"
            >
              {t("tech.pinSave")}
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-border p-4">
          <h3 className="font-display text-lg">{t("tech.diagTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("tech.mode")}: {desktop ? t("tech.modeApp") : t("tech.modeWeb")}
          </p>

          <div className="mt-3">
            <p className="text-sm font-semibold">{t("tech.touchTest")}</p>
            <p className="text-xs text-muted-foreground">{t("tech.touchHint")}</p>
            <div
              onPointerDown={trackTouch}
              onPointerMove={(e) => {
                if (e.buttons > 0 || e.pointerType === "touch") trackTouch(e);
              }}
              className="relative mt-2 h-32 touch-none overflow-hidden rounded-xl border border-dashed border-border bg-secondary/40"
            >
              {strokes.map((p, i) => (
                <span
                  key={i}
                  className="absolute h-2 w-2 rounded-full bg-zeno-blue"
                  style={{ left: p.x - 4, top: p.y - 4 }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t("tech.touchPoints", { count: touchPoints })}
              </span>
              <button
                onClick={() => {
                  setStrokes([]);
                  setTouchPoints(0);
                }}
                className="rounded-xl bg-secondary px-3 py-1 text-xs font-semibold"
              >
                {t("tech.touchClear")}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => void update()}
              disabled={checking}
              className="rounded-xl bg-zeno-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              ⬆️ {t("tech.update")}
            </button>
            <button
              onClick={() => (desktop ? void toggleAutoStart() : toast.info(t("tech.appOnly")))}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                desktop && autoStart ? "bg-zeno-blue text-white" : "bg-secondary"
              }`}
            >
              🖥️ {t("tech.autoStart")}
            </button>
            <button
              onClick={() => (desktop ? quitApp() : toast.info(t("tech.appOnly")))}
              className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold sm:col-span-2"
            >
              ⏻ {t("tech.quit")}
            </button>
          </div>
        </section>

        {!desktop ? (
          <section className="mt-4 rounded-2xl border border-border p-4">
            <h3 className="font-display text-lg">💾 {t("tech.installTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("tech.installHint")}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>{t("tech.install1")}</li>
              <li>{t("tech.install2")}</li>
              <li>{t("tech.install3")}</li>
              <li>{t("tech.install4")}</li>
              <li>{t("tech.install5")}</li>
            </ol>
          </section>
        ) : null}

        {!desktop ? (
          <section className="mt-4 rounded-2xl border border-border p-4">
            <h3 className="font-display text-lg">📱 {t("tech.androidTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("tech.androidHint")}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>{t("tech.android1")}</li>
              <li>{t("tech.android2")}</li>
              <li>{t("tech.android3")}</li>
              <li>{t("tech.android4")}</li>
              <li>{t("tech.android5")}</li>
              <li>{t("tech.android6")}</li>
            </ol>
          </section>
        ) : null}

        <section className="mt-4 rounded-2xl border border-destructive/40 p-4">
          <h3 className="font-display text-lg">🔌 {t("tech.shutdown")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("tech.shutdownHint")}</p>
          {!confirmOff ? (
            <button
              onClick={() => (canShutdown() ? setConfirmOff(true) : toast.info(t("tech.appOnly")))}
              className="mt-3 w-full rounded-2xl bg-destructive px-4 py-3 font-display text-lg text-destructive-foreground"
            >
              {t("tech.shutdown")}
            </button>
          ) : (
            <div className="mt-3">
              <p className="text-sm font-semibold">{t("tech.shutdownConfirm")}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => void shutdown()}
                  disabled={shuttingDown}
                  className="flex-1 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
                >
                  {t("tech.shutdownYes")}
                </button>
                <button
                  onClick={() => setConfirmOff(false)}
                  disabled={shuttingDown}
                  className="flex-1 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold"
                >
                  {t("tech.shutdownNo")}
                </button>
              </div>
            </div>
          )}
        </section>

        <Link
          to="/painel"
          className="mt-4 block rounded-2xl bg-wood-dark px-4 py-3 text-center font-display text-lg text-white"
        >
          {t("common.restricted")}
        </Link>
      </div>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-secondary/60 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-semibold ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
