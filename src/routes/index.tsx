import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/zeno/BrandMark";
import { ZenoSays } from "@/components/zeno/ZenoSays";
import { HeroBanner } from "@/components/zeno/HeroBanner";
import { GameTile } from "@/components/zeno/GameTile";
import { CategoryDial } from "@/components/zeno/CategoryDial";
import { LiteracyAreaCard, LiteracyScreen } from "@/components/zeno/LiteracyScreen";
import { isLiteracy, literacyToGame, type LiteracyActivity } from "@/lib/literacy/catalog";
import { FonoScreen } from "@/components/zeno/FonoScreen";
import { fonoToGame, type FonoActivity } from "@/lib/fono/catalog";
import { arcadeCatalog, arcadeToGame } from "@/lib/arcade/catalog";
import { actionCatalog, actionToGame } from "@/lib/arcade/action";
import { RotationFrame, useRotation } from "@/components/zeno/RotationFrame";
import { loadActivities, activityToGame } from "@/lib/activities";
import { GamePlayer } from "@/components/games/GamePlayer";
import { GameShell } from "@/components/games/GameShell";
import { GameIntro } from "@/components/games/GameIntro";
import memoryBg from "@/assets/scenes/memory-bg.jpg.asset.json";
import shapesBg from "@/assets/scenes/shapes-bg.jpg.asset.json";

import { categoryOf, sceneFor } from "@/lib/categories";
import { playSfx, setSoundEnabled, soundEnabled, speak, stopSpeaking } from "@/lib/audio";
import { LanguageSwitch } from "@/components/zeno/LanguageSwitch";
import { useI18n, useT } from "@/lib/i18n";
import type { TKey } from "@/lib/i18n/pt";
import {
  avatarCharacters,
  gameCatalog,
  levels,
  portraitOf,
  type CatalogGame,
  type GameResult,
} from "@/lib/zeno";
import { flushQueue, getDeviceCode, pendingCount, recordSession } from "@/lib/session-sync";
import { registerServiceWorker, useConnection } from "@/lib/offline";
import { TechPanel } from "@/components/zeno/TechPanel";
import { onWillShutdown } from "@/lib/desktop";
import { restoreKiosk } from "@/lib/kiosk";
import { LoginScreen } from "@/components/zeno/LoginScreen";
import { DeviceActivationScreen, deviceActivated } from "@/components/zeno/DeviceActivationScreen";
import { isDesktop } from "@/lib/desktop";
import { kioskEnabled } from "@/lib/kiosk";
import { ZenoHome } from "@/components/zeno/ZenoHome";
import { SettingsApp } from "@/components/zeno/SettingsApp";
import type { ZenoAppId } from "@/lib/apps";
import { appState, cachedAppAccess, loadAppAccess, type AppAccessMap } from "@/lib/appAccess";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Turma do Zeno — Mesa interativa de aprendizagem infantil" },
      {
        name: "description",
        content:
          "Jogos educativos, avatar e acompanhamento de desempenho para escolas e clínicas, com o robô Zeno guiando cada criança.",
      },
      { property: "og:title", content: "Turma do Zeno — Aprender, brincar, descobrir, evoluir" },
      {
        property: "og:description",
        content: "Mesa interativa com jogos educativos e relatórios de desempenho para profissionais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KidsApp,
});

interface Student {
  id: string;
  full_name: string;
  nickname: string | null;
  organization_id: string;
  avatar: { color?: string; face?: string; character?: string } | null;
}

const AVATAR_COLORS = ["bg-zeno-blue", "bg-zeno-green", "bg-zeno-orange", "bg-zeno-purple", "bg-zeno-pink"];

const GUEST: Student = {
  id: "guest",
  full_name: "Zeno",
  nickname: "Zeno",
  organization_id: "",
  avatar: { color: "bg-zeno-blue", character: "zeno" },
};

type Screen =
  | "login"
  | "students"
  | "home"
  | "menu"
  | "games"
  | "level"
  | "playing"
  | "avatar"
  | "achievements"
  | "literacy"
  | "fonoplay";
type DuoSide = "primary" | "partner";
type DuoResults = Partial<Record<DuoSide, GameResult>>;

function firstNameOf(item: Student | null): string {
  if (!item) return "Zeno";
  const preferred = item.nickname ?? item.full_name.split(" ")[0];
  return preferred || "Zeno";
}

function KidsApp() {
  const t = useT();
  const { lang } = useI18n();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [student, setStudent] = useState<Student | null>(GUEST);
  const [screen, setScreen] = useState<Screen>("login");
  const [isAdmin, setIsAdmin] = useState(false);
  const [bootKey, setBootKey] = useState(0);
  // Mesa dedicada (quiosque ou app Windows) precisa do código de ativação antes do login.
  const [needsActivation, setNeedsActivation] = useState(false);
  useEffect(() => {
    setNeedsActivation((kioskEnabled() || isDesktop()) && !deviceActivated());
  }, [bootKey]);

  const [settings, setSettings] = useState(false);
  const [game, setGame] = useState<CatalogGame | null>(null);
  const [level, setLevel] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  /** Tela para onde voltar ao sair do jogo (atividades ou alfabetização). */
  const [origin, setOrigin] = useState<Screen>("games");
  const [duo, setDuo] = useState(false);
  const [partner, setPartner] = useState<Student | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [duoResults, setDuoResults] = useState<DuoResults>({});
  const [intro, setIntro] = useState(false);
  const [sessions, setSessions] = useState<number>(0);
  const [stars, setStars] = useState<number>(0);
  const [pending, setPending] = useState(0);
  const [sound, setSound] = useState(true);
  const [activities, setActivities] = useState<CatalogGame[]>([]);
  const [tech, setTech] = useState(false);
  const [access, setAccess] = useState<AppAccessMap>(() => ({}));
  const { rotation, rotate } = useRotation();

  const online = useConnection(setPending);

  useEffect(() => setSound(soundEnabled()), []);
  useEffect(() => registerServiceWorker(), []);
  useEffect(() => restoreKiosk(), []);
  useEffect(() => {
    setAccess(cachedAppAccess());
    void loadAppAccess().then(setAccess);
  }, [bootKey]);

  // Desligamento da mesa: garante que a fila local seja gravada/enviada antes de fechar.
  useEffect(() => {
    const save = () => {
      void flushQueue().then((left) => setPending(left));
    };
    window.addEventListener("zeno:will-shutdown", save);
    window.addEventListener("pagehide", save);
    const off = onWillShutdown(save);
    return () => {
      window.removeEventListener("zeno:will-shutdown", save);
      window.removeEventListener("pagehide", save);
      off();
    };
  }, []);

  function toggleSound() {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) speak(t("common.sound.enabled"));
  }


  useEffect(() => {
    let active = true;
    async function currentSession() {
      // Logo após o login a sessão pode demorar alguns instantes para ficar
      // disponível no armazenamento: tentamos algumas vezes antes de desistir.
      for (let attempt = 0; attempt < 6; attempt++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) return data.session;
        if (!active) return null;
        await new Promise((r) => setTimeout(r, 250));
      }
      return null;
    }
    async function boot() {
      const session = await currentSession();
      if (!active) return;
      if (!session) {
        setSignedIn(false);
        setIsAdmin(false);
        setScreen("login");
        setReady(true);
        return;
      }
      setSignedIn(true);
      setScreen("students");
      void supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .then(({ data: roles }) => {
          // Apenas papéis administrativos abrem configurações e painel.
          const admin = (roles ?? []).some((r) =>
            ["super_admin", "city_admin", "org_admin"].includes(r.role as string),
          );
          if (active) setIsAdmin(admin);
        });
      const { data: rows } = await supabase
        .from("students")
        .select("id, full_name, nickname, organization_id, avatar")
        .eq("active", true)
        .order("full_name");
      if (!active) return;
      setStudents((rows ?? []) as unknown as Student[]);
      setPending(pendingCount());
      void loadActivities().then((rows) => {
        if (active) setActivities(rows.map(activityToGame));
      });
      void flushQueue().then((left) => setPending(left));
      setReady(true);
    }
    void boot();
    return () => {
      active = false;
    };
  }, [bootKey]);



  async function openStudent(item: Student) {
    setStudent(item);
    setScreen("home");
    if (item.id === "guest") {
      setSessions(0);
      setStars(0);
      return;
    }
    const { data } = await supabase.from("game_sessions").select("score").eq("student_id", item.id);
    setSessions(data?.length ?? 0);
    setStars(Math.floor((data ?? []).reduce((sum, s) => sum + (s.score ?? 0), 0) / 20));
  }

  async function saveSessionFor(player: Student | null, r: GameResult, updateCurrentStats: boolean) {
    if (!player || !game || player.id === "guest") return;
    await recordSession({
      organization_id: player.organization_id,
      student_id: player.id,
      game_slug: game.slug,
      skill: game.skill,
      level,
      score: r.score,
      hits: r.hits,
      misses: r.misses,
      duration_seconds: r.durationSeconds,
      device_code: getDeviceCode(),
      played_at: new Date().toISOString(),
      events: r.events ?? [],
      student_name: player.nickname || player.full_name,
    });
    setPending(pendingCount());
    if (updateCurrentStats) {
      setSessions((s) => s + 1);
      setStars((s) => s + Math.floor(r.score / 20));
    }
  }

  async function finishGame(r: GameResult) {
    setResult(r);
    playSfx("win");
    await saveSessionFor(student, r, true);
  }

  async function finishDuoGame(side: DuoSide, player: Student | null, r: GameResult) {
    setDuoResults((current) => ({ ...current, [side]: r }));
    playSfx("win");
    await saveSessionFor(player, r, player?.id === student?.id);
  }

  const firstName = firstNameOf(student);

  const selectedPartner = partner ?? GUEST;
  const gameBackground = game
    ? game.slug === "memoria-turma"
      ? memoryBg.url
      : game.slug === "formas-e-encaixes"
        ? shapesBg.url
        : sceneFor(game.slug)
    : undefined;

  const exitGame = () => {
    stopSpeaking();
    setResult(null);
    setDuoResults({});
    setScreen(origin);
  };

  if (!ready) {
    return (
      <main className="surface-wood flex min-h-screen items-center justify-center">
        <ZenoSays message={t("common.loading")} size="lg" />

      </main>
    );
  }

  if (screen === "login") {
    // Em mesa/quiosque, o primeiro acesso exige o código de ativação.
    if (needsActivation) {
      return (
        <DeviceActivationScreen
          onActivated={() => {
            setSignedIn(true);
            setReady(false);
            setBootKey((k) => k + 1);
          }}
        />
      );
    }
    return (
      <LoginScreen
        onSignedIn={() => {
          setSignedIn(true);
          setReady(false);
          setBootKey((k) => k + 1);
        }}

      />
    );
  }


  if (screen === "playing" && game) {
    return (
      <RotationFrame rotation={rotation}>
        <main className="surface-wood h-full overflow-hidden">
          {intro ? (
            <GameIntro game={game} onDone={() => setIntro(false)} />
          ) : result ? (
            <div className="flex h-full items-center justify-center p-4">
              <ResultCard
                result={result}
                onAgain={() => setResult(null)}
                onBack={() => {
                  setResult(null);
                  setScreen(origin);
                }}
              />
            </div>
          ) : duo ? (
            <div className="grid h-full min-h-0 grid-rows-2">
              {/* metade de cima virada: as crianças jogam de frente uma para a outra */}
              <div className="min-h-0 rotate-180 border-b-4 border-white/40">
              <GameShell
                game={game}
                level={level}
                soundOn={sound}
                onToggleSound={toggleSound}
                onRotate={rotate}
                fit={game.slug !== "desenho-livre" && game.slug !== "pintura-da-turma"}
                background={gameBackground}
                players={[{ name: firstName }]}
                onExit={exitGame}
              >
                {duoResults.primary ? (
                  <ResultCard
                    result={duoResults.primary}
                    onAgain={() => setDuoResults(({ primary: _primary, ...current }) => current)}
                    onBack={exitGame}
                  />
                ) : (
                  <GamePlayer
                    key={`${game.activityId ?? game.slug}-${level}-${student?.id ?? "guest"}-primary`}
                    slug={game.slug}
                    level={level}
                    config={game.config as { count?: number } | undefined}
                    onFinish={(r) => finishDuoGame("primary", student, r)}
                  />
                )}
              </GameShell>
              </div>
              <div className="min-h-0">
              <GameShell
                game={game}
                level={level}
                soundOn={sound}
                onToggleSound={toggleSound}
                onRotate={rotate}
                fit={game.slug !== "desenho-livre" && game.slug !== "pintura-da-turma"}
                background={gameBackground}
                players={[{ name: firstNameOf(selectedPartner) }]}
                onExit={exitGame}
              >
                {duoResults.partner ? (
                  <ResultCard
                    result={duoResults.partner}
                    onAgain={() => setDuoResults(({ partner: _partner, ...current }) => current)}
                    onBack={exitGame}
                  />
                ) : (
                  <GamePlayer
                    key={`${game.activityId ?? game.slug}-${level}-${selectedPartner.id}-partner`}
                    slug={game.slug}
                    level={level}
                    config={game.config as { count?: number } | undefined}
                    onFinish={(r) => finishDuoGame("partner", selectedPartner, r)}
                  />
                )}
              </GameShell>
              </div>
            </div>
          ) : (
            <GameShell
              game={game}
              level={level}
              soundOn={sound}
              onToggleSound={toggleSound}
              onRotate={rotate}
              fit={game.slug !== "desenho-livre" && game.slug !== "pintura-da-turma"}
              background={gameBackground}

              players={[{ name: firstName }]}
              onExit={exitGame}
            >
              <GamePlayer
                key={`${game.activityId ?? game.slug}-${level}`}
                slug={game.slug}
                level={level}
                config={game.config as { count?: number } | undefined}
                onFinish={finishGame}
              />
            </GameShell>
          )}
        </main>
      </RotationFrame>
    );
  }

  return (
    <RotationFrame rotation={rotation}>
      <main className="surface-kids flex h-full flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-5 pt-2 sm:px-8">
        <TopBar
          student={student}
          pending={pending}
          online={online}
          onTech={() => setTech(true)}

          rotation={rotation}
          sound={sound}
          onToggleSound={toggleSound}
          onRotate={rotate}
          onHome={() => {
            stopSpeaking();
            setScreen("home");
            setResult(null);
          }}
          onExit={() => {
            stopSpeaking();
            setStudent(null);
            setScreen("students");
            setResult(null);
          }}
        />

        {screen === "students" && (
          <StudentPicker
            students={students}
            onPick={openStudent}
            onGuest={() => openStudent(GUEST)}
            signedIn={signedIn}
            canManage={isAdmin}
          />
        )}

        {screen === "home" && (
          <ZenoHome
            childName={firstName}
            avatarCharacter={student?.avatar?.character}
            avatarColor={student?.avatar?.color}
            isAdmin={isAdmin}
            access={access}
            onSwitchChild={() => setScreen("students")}
            onOpenApp={(app: ZenoAppId) => {
              playSfx("tap");
              if (appState(access, app) !== "ok") return;
              if (app === "games") {
                setOrigin("games");
                setScreen("games");
              } else if (app === "literacy") {
                setOrigin("literacy");
                setScreen("literacy");
              } else if (app === "fonoplay") {
                setOrigin("fonoplay");
                setScreen("fonoplay");
              } else if (app === "settings" && isAdmin) {
                setSettings(true);
              }
            }}
          />
        )}

        {screen === "menu" && student && (
          <MainMenu student={student} onSelect={(next) => setScreen(next)} stars={stars} sessions={sessions} />
        )}

        {screen === "games" && (
          <GamesScreen
            student={student}
            onOpenLiteracy={() => {
              setOrigin("literacy");
              setScreen("literacy");
            }}
            category={category}
            onCategory={setCategory}
            activities={activities}
            onPickStudent={() => setScreen("students")}
            onPlay={(g) => {
              playSfx("tap");
              setOrigin("games");
              setGame(g);
              setResult(null);
              setScreen("level");
            }}
          />
        )}

        {screen === "literacy" && (
          <LiteracyScreen
            onBack={() => setScreen("home")}
            onPlay={(activity: LiteracyActivity) => {
              setOrigin("literacy");
              setGame(literacyToGame(activity, lang));
              setLevel(1);
              setResult(null);
              setScreen("level");
            }}
          />
        )}

        {screen === "fonoplay" && (
          <FonoScreen
            onBack={() => setScreen("home")}
            onPlay={(activity: FonoActivity) => {
              setOrigin("fonoplay");
              setGame(fonoToGame(activity, lang));
              setLevel(1);
              setResult(null);
              setScreen("level");
            }}
          />
        )}


        {screen === "level" && game && (
          <LevelScreen
            game={game}
            level={level}
            onLevel={setLevel}
            duo={duo}
            onDuo={(next) => {
              setDuo(next);
              setPartner(next ? selectedPartner : null);
              setDuoResults({});
            }}
            students={students}
            currentStudent={student}
            partner={selectedPartner}
            onPartner={(next) => {
              setPartner(next);
              setDuo(true);
            }}
            onBack={() => setScreen(origin)}
            onStart={() => {
              playSfx("tap");
              setIntro(true);
              setResult(null);
              setDuoResults({});
              setScreen("playing");
            }}
          />
        )}

        {screen === "avatar" && student && (
          <AvatarScreen
            student={student}
            onSave={(avatar) => {
              setStudent({ ...student, avatar });
              setStudents((list) => list.map((s) => (s.id === student.id ? { ...s, avatar } : s)));
            }}
          />
        )}

        {screen === "achievements" && <Achievements stars={stars} sessions={sessions} />}
        </div>

        <BottomNav
          isAdmin={isAdmin}
          screen={screen}
          onSelect={(next) => {
            playSfx("tap");
            stopSpeaking();
            setResult(null);
            setScreen(next);
          }}
        />

        {settings && isAdmin && <SettingsApp online={online} onClose={() => setSettings(false)} />}
        {tech && <TechPanel online={online} onClose={() => setTech(false)} />}
      </main>
    </RotationFrame>
  );
}

function BottomNav({
  screen,
  onSelect,
  isAdmin,
}: {
  screen: Screen;
  onSelect: (s: Screen) => void;
  isAdmin: boolean;
}) {
  const t = useT();
  const items: { key: Screen; label: string; icon: string }[] = [
    { key: "home", label: t("nav.games"), icon: "🏠" },
    { key: "games", label: t("app.games.title"), icon: "🎮" },
    { key: "achievements", label: t("nav.achievements"), icon: "⭐" },
    { key: "avatar", label: t("nav.avatar"), icon: "👕" },
    { key: "students", label: t("nav.students"), icon: "👧" },
  ];

  return (
    <div className="px-4 sm:px-8">
    <nav className="mx-auto mb-3 flex w-full max-w-2xl items-center justify-between gap-1 rounded-full bg-card/95 px-2 py-2 shadow-toy backdrop-blur">
      {items.map((item) => {
        const on = screen === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-xs font-semibold transition-colors ${
              on ? "bg-secondary text-zeno-blue" : "text-muted-foreground"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            {item.label}
          </button>
        );
      })}
      {isAdmin && (
      <Link
        to="/painel"
        className="flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-xs font-semibold text-muted-foreground"
      >
        <span className="text-xl leading-none">📊</span>
        {t("nav.reports")}
      </Link>
      )}
      </nav>
    </div>
  );
}

function TopBar({
  student,
  pending,
  online,
  rotation,
  sound,
  onToggleSound,
  onRotate,
  onHome,
  onExit,
  onTech,
}: {
  student: Student | null;
  pending: number;
  online: boolean;
  rotation: number;
  sound: boolean;
  onToggleSound: () => void;
  onRotate: () => void;
  onHome: () => void;
  onExit: () => void;
  onTech: () => void;
}) {
  const t = useT();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unlock, setUnlock] = useState(false);

  const hold = () => {
    timer.current = setTimeout(() => setUnlock(true), 2500);
  };
  const release = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <header className="mx-auto mb-5 flex max-w-6xl flex-wrap items-center justify-between gap-3 px-1 py-1">
      <button onPointerDown={hold} onPointerUp={release} onPointerLeave={release} aria-label={t("common.brand")}>
        <BrandMark />
      </button>
      <div className="flex flex-wrap items-center gap-2">
        {!online && (
          <span className="rounded-full bg-zeno-orange px-4 py-2 text-sm font-semibold text-white">
            📴 {t("common.offline")}
          </span>
        )}
        {pending > 0 && (
          <span className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
            {t("common.pending", { count: pending })}
          </span>
        )}
        <LanguageSwitch compact />
        <button
          onClick={onToggleSound}
          aria-label={sound ? t("common.sound.off") : t("common.sound.on")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-card text-2xl shadow-card active:scale-95"
        >
          {sound ? "🔈" : "🔇"}
        </button>
        <button
          onClick={onRotate}
          aria-label={t("common.rotate")}
          title={t("common.rotate")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-card text-2xl shadow-card active:scale-95"
        >
          <span style={{ transform: `rotate(${rotation}deg)`, display: "inline-block" }}>🔄</span>
        </button>
        <button
          onClick={onHome}
          className="flex items-center gap-2 rounded-full bg-zeno-blue px-5 py-3 font-display text-lg text-white shadow-card active:scale-95"
        >
          🏠 {t("common.home")}
        </button>
        {student && (
          <button
            onClick={onExit}
            className="flex items-center gap-2 rounded-full bg-card px-3 py-2 text-left shadow-card active:scale-95"
          >
            <img
              src={portraitOf(student.avatar?.character)}
              alt=""
              width={256}
              height={256}
              className={`h-10 w-10 rounded-full object-cover ${student.avatar?.color ?? "bg-zeno-blue"}`}
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-base leading-tight">
                {student.nickname ?? student.full_name.split(" ")[0]}
              </span>
              <span className="block text-xs text-muted-foreground">{t("common.profile")}</span>
            </span>
          </button>
        )}
        {unlock && (
          <button
            onClick={() => {
              setUnlock(false);
              onTech();
            }}
            className="rounded-full bg-wood-dark px-5 py-3 font-display text-lg text-white shadow-card"
          >
            🔧 {t("tech.open")}
          </button>
        )}

      </div>
    </header>
  );
}

function StudentPicker({
  students,
  onPick,
  onGuest,
  signedIn,
  canManage,
}: {
  students: Student[];
  onPick: (s: Student) => void;
  onGuest: () => void;
  signedIn: boolean;
  canManage: boolean;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const visible = term
    ? students.filter((s) => `${s.full_name} ${s.nickname ?? ""}`.toLowerCase().includes(term))
    : students;
  return (
    <section className="mx-auto max-w-6xl">
      <HeroBanner title={t("students.title")} subtitle={t("students.subtitle")} />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("students.search")}
          aria-label={t("students.search")}
          className="min-h-[3.5rem] min-w-[16rem] flex-1 rounded-full border border-border bg-card px-6 text-lg shadow-card"
        />
        {canManage && (
          <Link
            to="/painel"
            className="flex min-h-[3.5rem] items-center rounded-full bg-zeno-green px-6 font-display text-lg text-white shadow-card active:scale-95"
          >
            ➕ {t("students.new")}
          </Link>
        )}
      </div>

      <div className="mt-6 flex snap-x gap-5 overflow-x-auto pb-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onGuest}
          className="w-52 shrink-0 snap-center rounded-[2rem] bg-card p-6 shadow-card"
        >
          <img src={portraitOf("zeno")} alt="Zeno" width={256} height={256} className="mx-auto h-28 w-28 rounded-full bg-zeno-blue object-cover ring-4 ring-zeno-blue/40" />
          <span className="mt-4 block font-display text-xl">{t("students.guest")}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{t("students.guestHint")}</span>
        </motion.button>

        {visible.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPick(s)}
            className="w-52 shrink-0 snap-center rounded-[2rem] bg-card p-6 shadow-card"
          >
            <img
              src={portraitOf(s.avatar?.character)}
              alt=""
              width={256}
              height={256}
              className={`mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-white/60 ${s.avatar?.color ?? "bg-zeno-blue"}`}
            />
            <span className="mt-4 block truncate font-display text-xl">{s.nickname ?? s.full_name}</span>
          </motion.button>
        ))}
      </div>
      {students.length > 0 && visible.length === 0 && (
        <p className="mt-4 rounded-3xl bg-card p-6 text-center text-muted-foreground shadow-card">
          {t("students.none")}
        </p>
      )}
      {students.length === 0 && (
        <div className="mt-4 rounded-3xl bg-card p-6 text-center text-muted-foreground shadow-card">
          {signedIn ? (
            <p>{t("students.empty")}</p>
          ) : (
            <p>
              {t("students.noOrg")}{" "}
              <Link to="/auth" className="font-display text-zeno-blue">
                {t("students.setup")}
              </Link>
            </p>
          )}

        </div>
      )}
    </section>
  );
}

function MainMenu({
  student,
  onSelect,
  stars,
  sessions,
}: {
  student: Student;
  onSelect: (s: Screen) => void;
  stars: number;
  sessions: number;
}) {
  const t = useT();
  const items = [
    { key: "games" as const, label: t("menu.play"), emoji: "🎮", color: "bg-zeno-blue" },
    { key: "avatar" as const, label: t("menu.avatar"), emoji: "🎨", color: "bg-zeno-purple" },
    { key: "achievements" as const, label: t("menu.achievements"), emoji: "⭐", color: "bg-zeno-orange" },
  ];
  return (
    <section className="mx-auto max-w-6xl">
      <HeroBanner
        title={t("menu.hi", { name: student.nickname ?? student.full_name.split(" ")[0]! })}
        subtitle={t("menu.stats", { sessions, stars })}
      />

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {items.map((item, i) => (
          <motion.button
            key={item.key}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(item.key)}
            className={`relative overflow-hidden rounded-[2rem] p-8 text-white shadow-toy ${item.color}`}
          >
            <span className="pattern-stars absolute inset-0 opacity-30" />
            <span className="relative block text-6xl">{item.emoji}</span>
            <span className="relative mt-4 block font-display text-2xl">{item.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function GamesScreen({
  student,
  category,
  onCategory,
  onPlay,
  activities,
  onPickStudent,
  onOpenLiteracy,
}: {
  student: Student | null;
  category: string | null;
  onCategory: (id: string | null) => void;
  onPlay: (g: CatalogGame) => void;
  activities: CatalogGame[];
  onPickStudent: () => void;
  onOpenLiteracy: () => void;
}) {
  const t = useT();
  const { lang } = useI18n();
  const customSlugs = new Set(activities.map((a) => a.slug));
  const generated = arcadeCatalog.map((g) => arcadeToGame(g, lang));
  const dynamic = actionCatalog.map((g) => actionToGame(g, lang));
  const all = [...dynamic, ...activities, ...gameCatalog.filter((g) => !customSlugs.has(g.slug)), ...generated];
  const list = category ? all.filter((g) => categoryOf(g.slug).id === category) : all;
  return (
    <section className="mx-auto max-w-6xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <CategoryDial active={category} onChange={onCategory} />
        <button
          onClick={onPickStudent}
          aria-label={t("students.pick")}
          className="flex shrink-0 items-center gap-2 rounded-full bg-card px-3 py-2 shadow-card active:scale-95"
        >
          <img
            src={portraitOf(student?.avatar?.character)}
            alt=""
            width={256}
            height={256}
            className={`h-10 w-10 rounded-full object-cover ${student?.avatar?.color ?? "bg-zeno-blue"}`}
          />
        </button>
      </div>

      <div className="mt-4">
        <LiteracyAreaCard onOpen={onOpenLiteracy} />
      </div>

      <h2 className="mt-5 font-display text-2xl text-foreground sm:text-3xl">{t("games.activities")}</h2>

      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {list.map((g, i) => (
          <GameTile key={g.activityId ?? g.slug} game={g} index={i} onPlay={() => onPlay(g)} />
        ))}
      </div>
    </section>
  );
}

/** Escolha de nível (e dupla) antes de abrir o jogo. */
function LevelScreen({
  game,
  level,
  onLevel,
  duo,
  onDuo,
  students,
  currentStudent,
  partner,
  onPartner,
  onStart,
  onBack,
}: {
  game: CatalogGame;
  level: number;
  onLevel: (n: number) => void;
  duo: boolean;
  onDuo: (v: boolean) => void;
  students: Student[];
  currentStudent: Student | null;
  partner: Student;
  onPartner: (s: Student) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const t = useT();
  const title = game.customTitle ?? t(`game.${game.slug}.title` as TKey);
  const partnerOptions = [GUEST, ...students.filter((item) => item.id !== currentStudent?.id)];
  return (
    <section className="mx-auto max-w-4xl text-center">
      <div className="rounded-[2rem] bg-card/95 p-6 shadow-card backdrop-blur">
        <img
          src={portraitOf(game.character)}
          alt=""
          width={256}
          height={256}
          className="mx-auto h-28 w-28 object-contain drop-shadow-lg"
        />
        <p className="mt-2 font-display text-2xl sm:text-3xl">
          {game.emoji} {title}
        </p>
        <p className="mt-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">{t("games.chooseLevel")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {levels
            .filter((l) => (isLiteracy(game.slug) ? l.level <= 3 : true))
            .map((l) => (
            <button
              key={l.level}
              onClick={() => onLevel(l.level)}
              className={`rounded-[1.5rem] px-4 py-3 shadow-card transition-transform active:scale-95 ${
                level === l.level ? "bg-zeno-green text-white" : "bg-secondary/60"
              }`}
            >
              <span className="block font-display text-2xl leading-tight">{l.level}</span>
              <span className="block text-sm">{t(`level.${l.level}` as TKey)}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <div className="flex rounded-full bg-secondary/60 p-1 shadow-card">
            <button
              onClick={() => onDuo(false)}
              className={`rounded-full px-5 py-2.5 font-display text-lg active:scale-95 ${duo ? "" : "bg-zeno-green text-white"}`}
            >
              👤 {t("games.solo")}
            </button>
            <button
              onClick={() => onDuo(true)}
              className={`rounded-full px-5 py-2.5 font-display text-lg active:scale-95 ${duo ? "bg-zeno-purple text-white" : ""}`}
            >
              👫 {t("games.duo")}
            </button>
          </div>
          {duo ? (
            <div className="w-full rounded-[1.5rem] bg-secondary/40 p-4 text-left">
              <p className="text-center font-display text-xl text-foreground">{t("games.pickPartner")}</p>
              <p className="mt-1 text-center text-sm text-muted-foreground">{t("games.partnerHint")}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {partnerOptions.map((item) => {
                  const selected = partner.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onPartner(item)}
                      className={`flex min-w-0 items-center gap-2 rounded-[1.25rem] bg-card p-2 text-left shadow-card active:scale-95 ${
                        selected ? "ring-4 ring-zeno-green" : ""
                      }`}
                    >
                      <img
                        src={portraitOf(item.avatar?.character)}
                        alt=""
                        width={256}
                        height={256}
                        className={`h-12 w-12 shrink-0 rounded-full object-cover ${item.avatar?.color ?? "bg-zeno-blue"}`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-display text-base leading-tight">{firstNameOf(item)}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.id === "guest" ? t("games.partnerZenoHint") : t("games.partnerTrackedHint")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <button
            onClick={onBack}
            className="rounded-full bg-card px-5 py-3 font-display text-lg shadow-card active:scale-95"
          >
            ← {t("games.chooseGame")}
          </button>
          <button
            onClick={onStart}
            className="rounded-full bg-zeno-blue px-8 py-3 font-display text-xl text-white shadow-toy active:scale-95"
          >
            ▶ {t("games.start")}
          </button>
        </div>
      </div>
    </section>
  );
}


function ResultCard({
  result,
  onAgain,
  onBack,
}: {
  result: GameResult;
  onAgain: () => void;
  onBack: () => void;
}) {
  const t = useT();
  const key = useMemo(() => `celebration.${1 + Math.floor(Math.random() * 4)}` as TKey, []);
  const message = t(key);

  const earned = Math.max(1, Math.floor(result.score / 20));

  useEffect(() => {
    speak(message);
  }, [message]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative mx-auto max-w-xl overflow-hidden rounded-[2rem] bg-card p-8 text-center shadow-toy"
    >
      <span className="pattern-stars absolute inset-0 opacity-40" />
      <div className="relative">
        <ZenoSays message={message} size="lg" />
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: Math.min(5, earned) }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15 * i, type: "spring", stiffness: 300, damping: 12 }}
              className="text-5xl"
            >
              ⭐
            </motion.span>
          ))}
        </div>
        <p className="mt-3 text-lg text-muted-foreground">
          {t("result.stars", { hits: result.hits, seconds: result.durationSeconds })}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button onClick={onAgain} className="rounded-full bg-zeno-green px-8 py-4 font-display text-xl text-white shadow-card active:scale-95">
            {t("result.again")}
          </button>
          <button onClick={onBack} className="rounded-full bg-secondary px-8 py-4 font-display text-xl shadow-card active:scale-95">
            {t("result.back")}
          </button>

        </div>
      </div>
    </motion.div>
  );
}

function AvatarScreen({
  student,
  onSave,
}: {
  student: Student;
  onSave: (avatar: { color: string; face: string; character: string }) => void;
}) {
  const t = useT();
  const [color, setColor] = useState(student.avatar?.color ?? AVATAR_COLORS[0]!);

  const [face, setFace] = useState(student.avatar?.face ?? "🤖");
  const [character, setCharacter] = useState(student.avatar?.character ?? "zeno");
  const [saved, setSaved] = useState(false);

  async function save() {
    if (student.id === "guest") {
      onSave({ color, face, character });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    await supabase.from("students").update({ avatar: { color, face, character } }).eq("id", student.id);
    onSave({ color, face, character });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="mx-auto max-w-3xl text-center">
      <ZenoSays message={t("avatar.zenoSays")} />
      <img
        src={portraitOf(character)}
        alt=""
        width={256}
        height={256}
        className={`mx-auto mt-8 h-40 w-40 rounded-full object-cover shadow-toy ${color}`}
      />
      <p className="mt-3 font-display text-2xl">{student.nickname ?? student.full_name}</p>
      <p className="mt-8 font-display text-xl">{t("avatar.characters")}</p>

      <div className="mt-3 flex flex-wrap justify-center gap-4">
        {avatarCharacters.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              playSfx("tap");
              speak(c.name);
              setCharacter(c.id);
              setFace(c.emoji);
              setColor(c.color);
            }}
            className={`flex flex-col items-center gap-1 rounded-[1.5rem] bg-card p-3 shadow-card active:scale-95 ${
              character === c.id ? "ring-4 ring-zeno-green" : ""
            }`}
          >
            <img src={c.image} alt="" width={256} height={256} className={`h-16 w-16 rounded-full object-cover ${c.color}`} />
            <span className="font-display text-sm">{c.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-8 font-display text-xl">{t("avatar.color")}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-4">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c}
            aria-label={`${t("avatar.color")} ${c}`}
            onClick={() => setColor(c)}
            className={`h-16 w-16 rounded-full shadow-card active:scale-95 ${c} ${color === c ? "ring-4 ring-wood-dark" : ""}`}
          />
        ))}
      </div>
      <button
        onClick={save}
        className="mt-10 rounded-full bg-zeno-purple px-10 py-4 font-display text-xl text-white shadow-card active:scale-95"
      >
        {saved ? t("avatar.saved") : t("avatar.save")}
      </button>

    </section>
  );
}

function Achievements({ stars, sessions }: { stars: number; sessions: number }) {
  const t = useT();
  const badges = [
    { label: t("achievements.first"), emoji: "🚀", done: sessions >= 1 },
    { label: t("achievements.five"), emoji: "🏅", done: sessions >= 5 },
    { label: t("achievements.tenStars"), emoji: "⭐", done: stars >= 10 },
    { label: t("achievements.friend"), emoji: "🤖", done: sessions >= 10 },
  ];
  return (
    <section className="mx-auto max-w-4xl">
      <ZenoSays message={t("achievements.zenoSays")} />

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {badges.map((b) => (
          <div key={b.label} className={`rounded-[2rem] bg-card p-6 text-center shadow-card ${b.done ? "" : "opacity-40 grayscale"}`}>
            <span className="block text-5xl">{b.emoji}</span>
            <span className="mt-3 block font-display text-lg">{b.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
