import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { avatarCharacters } from "@/lib/zeno";
import { AnamnesisForm } from "@/components/painel/AnamnesisForm";
import type { Anamnesis } from "@/lib/anamnesis";

export interface NewStudentData {
  fullName: string;
  nickname: string;
  birthDate: string;
  character: string;
  /** Preenchidos só no cadastro completo. */
  anamnesis?: Anamnesis;
  cids?: string[];
}

/**
 * Formulário de cadastro de criança, usado tanto na mesa (touch) quanto no
 * celular do profissional (link do QR Code). Tem duas formas: rápido
 * (nome, apelido, data e personagem) e completo (com anamnese e CID).
 * Os avatares são personagens da Turma do Zeno — o nome digitado é o da criança.
 */
export function NewStudentForm({
  onSave,
  onCancel,
}: {
  onSave: (data: NewStudentData) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [character, setCharacter] = useState("zeno");
  const [full, setFull] = useState(false);
  const [anamnesis, setAnamnesis] = useState<Anamnesis>({});
  const [cids, setCids] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error(t("students.needName"));
      return;
    }
    setSaving(true);
    try {
      const filled = Object.fromEntries(
        Object.entries(anamnesis).filter(([, v]) => (v ?? "").trim() !== ""),
      ) as Anamnesis;
      await onSave({
        fullName: fullName.trim(),
        nickname: nickname.trim(),
        birthDate,
        character,
        ...(full && Object.keys(filled).length > 0 ? { anamnesis: filled } : {}),
        ...(full && cids.length > 0 ? { cids } : {}),
      });
      setFullName("");
      setNickname("");
      setBirthDate("");
      setCharacter("zeno");
      setAnamnesis({});
      setCids([]);
      setFull(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div className="flex rounded-full bg-secondary/50 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setFull(false)}
          className={`flex-1 rounded-full px-4 py-2 ${full ? "" : "bg-card shadow-card"}`}
        >
          {t("students.quick")}
        </button>
        <button
          type="button"
          onClick={() => setFull(true)}
          className={`flex-1 rounded-full px-4 py-2 ${full ? "bg-card shadow-card" : ""}`}
        >
          {t("students.complete")}
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-muted-foreground">{t("students.fullName")}</span>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 min-h-[3.25rem] w-full rounded-2xl border border-border bg-background px-4 text-lg"
          autoComplete="off"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-muted-foreground">{t("students.nickname")}</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="mt-1 min-h-[3.25rem] w-full rounded-2xl border border-border bg-background px-4 text-lg"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-muted-foreground">{t("students.birth")}</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 min-h-[3.25rem] w-full rounded-2xl border border-border bg-background px-4 text-lg"
          />
        </label>
      </div>

      <div>
        <span className="text-sm font-semibold text-muted-foreground">{t("students.chooseAvatar")}</span>
        <div className="mt-2 flex flex-wrap gap-3">
          {avatarCharacters.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCharacter(c.id)}
              className={`rounded-2xl bg-secondary/40 p-2 ${character === c.id ? "ring-4 ring-zeno-green" : ""}`}
            >
              <img src={c.image} alt={c.name} width={128} height={128} className={`h-16 w-16 rounded-full object-cover ${c.color}`} />
            </button>
          ))}
        </div>
      </div>

      {full && (
        <div className="rounded-2xl border border-border p-4">
          <AnamnesisForm value={anamnesis} onChange={setAnamnesis} cids={cids} onCidsChange={setCids} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="min-h-[3.25rem] rounded-full bg-zeno-green px-6 font-display text-lg text-white active:scale-95 disabled:opacity-60"
        >
          {t("students.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[3.25rem] rounded-full border border-border px-6 font-display text-lg active:scale-95"
        >
          {t("students.cancel")}
        </button>
      </div>
    </form>
  );
}
