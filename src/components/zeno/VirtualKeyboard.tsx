import { useCallback, useEffect, useRef, useState } from "react";
import { KEYBOARD_EVENT, keyboardEnabled, syncKeyboardSetting } from "@/lib/keyboard";

/**
 * Teclado na tela para mesas sem teclado físico.
 * Aparece sempre que um campo de texto recebe o toque e pode ser
 * desligado por mesa no painel do super administrador.
 * Pode ficar preso embaixo, flutuar (arrastável) ou minimizado.
 */

type Field = HTMLInputElement | HTMLTextAreaElement;

const TEXT_TYPES = new Set(["text", "email", "password", "search", "tel", "url", "number", ""]);

const LETTERS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ç"],
  ["z", "x", "c", "v", "b", "n", "m", "á", "é", "ã"],
];

const SYMBOLS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["@", "#", "$", "%", "&", "*", "-", "+", "(", ")"],
  ["!", "?", "\"", "'", ":", ";", "/", "\\", "=", "_"],
  ["[", "]", "{", "}", "<", ">", "^", "~", "|", "`"],
  [",", ".", "€", "£", "¥", "§", "º", "ª", "¿", "¡"],
];

const NUMBERS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["-", "0", "."],
];

const MODE_KEY = "zeno_keyboard_mode";
const POS_KEY = "zeno_keyboard_pos";

function isField(el: Element | null): el is Field {
  if (!el) return false;
  if (el.hasAttribute("data-no-keyboard")) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return TEXT_TYPES.has(el.type);
  return false;
}

function setValue(el: Field, value: string, caret: number) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  try {
    el.setSelectionRange(caret, caret);
  } catch {
    /* alguns tipos de campo não aceitam seleção */
  }
}

export function VirtualKeyboard() {
  const [enabled, setEnabled] = useState(false);
  const [field, setField] = useState<Field | null>(null);
  const [caps, setCaps] = useState(false);
  const [symbols, setSymbols] = useState(false);
  const [floating, setFloating] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const fieldRef = useRef<Field | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    const read = () => setEnabled(keyboardEnabled());
    read();
    void syncKeyboardSetting();
    window.addEventListener(KEYBOARD_EVENT, read);
    return () => window.removeEventListener(KEYBOARD_EVENT, read);
  }, []);

  useEffect(() => {
    try {
      setFloating(window.localStorage.getItem(MODE_KEY) === "float");
      const raw = window.localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { x: number; y: number };
        if (typeof p?.x === "number" && typeof p?.y === "number") setPos(p);
      }
    } catch {
      /* preferência opcional */
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = (e: FocusEvent) => {
      const el = e.target as Element | null;
      if (isField(el)) {
        fieldRef.current = el;
        setField(el);
        setMinimized(false);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Element | null;
      if (next?.closest?.("[data-zeno-keyboard]")) return;
      fieldRef.current = null;
      setField(null);
    };
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [enabled]);

  const press = useCallback(
    (key: string) => {
      const el = fieldRef.current;
      if (!el) return;
      const value = el.value ?? "";
      let start = value.length;
      let end = value.length;
      try {
        start = el.selectionStart ?? value.length;
        end = el.selectionEnd ?? value.length;
      } catch {
        /* campo sem seleção */
      }

      if (key === "\b") {
        const from = start === end ? Math.max(0, start - 1) : start;
        setValue(el, value.slice(0, from) + value.slice(end), from);
        return;
      }
      if (key === "\n") {
        if (el instanceof HTMLTextAreaElement) {
          setValue(el, value.slice(0, start) + "\n" + value.slice(end), start + 1);
        } else {
          el.form?.requestSubmit?.();
          el.blur();
        }
        return;
      }
      const text = caps && !symbols ? key.toUpperCase() : key;
      setValue(el, value.slice(0, start) + text + value.slice(end), start + text.length);
    },
    [caps, symbols],
  );

  const setMode = (float: boolean) => {
    setFloating(float);
    try {
      window.localStorage.setItem(MODE_KEY, float ? "float" : "dock");
    } catch {
      /* preferência opcional */
    }
  };

  const onDragStart = (e: React.PointerEvent) => {
    if (!floating) return;
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const next = {
      x: Math.max(0, Math.min(window.innerWidth - 120, e.clientX - d.dx)),
      y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - d.dy)),
    };
    setPos(next);
  };

  const onDragEnd = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      window.localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      /* preferência opcional */
    }
  };

  if (!enabled || !field) return null;

  const numeric = field instanceof HTMLInputElement && (field.type === "number" || field.type === "tel");
  const rows = numeric ? NUMBERS : symbols ? SYMBOLS : LETTERS;
  const isTextarea = field instanceof HTMLTextAreaElement;

  const shellClass = floating
    ? "fixed z-[80] w-[min(96vw,44rem)] rounded-2xl border border-border bg-card/95 p-2 shadow-card backdrop-blur"
    : "fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-card/95 px-2 pb-3 pt-2 shadow-card backdrop-blur";

  const style = floating ? { left: pos.x, top: pos.y } : undefined;

  if (minimized) {
    return (
      <button
        data-zeno-keyboard
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          setMinimized(false);
        }}
        style={floating ? { left: pos.x, top: pos.y } : undefined}
        className={`fixed z-[80] min-h-11 rounded-full border border-border bg-card/95 px-4 font-display text-lg text-foreground shadow-card backdrop-blur ${
          floating ? "" : "bottom-3 right-3"
        }`}
      >
        ⌨️
      </button>
    );
  }

  return (
    <div data-zeno-keyboard onPointerDown={(e) => e.preventDefault()} className={shellClass} style={style}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-1.5">
        <div
          className="flex items-center gap-1.5 pb-1"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          style={{ cursor: floating ? "grab" : "default", touchAction: "none" }}
        >
          <span className="select-none px-2 font-display text-base text-muted-foreground">
            {floating ? "✥ arraste aqui" : "⌨️ teclado"}
          </span>
          <div className="ml-auto flex gap-1.5">
            <Key label={floating ? "Fixar embaixo" : "Flutuar"} wide onPress={() => setMode(!floating)} />
            <Key label="—" onPress={() => setMinimized(true)} />
          </div>
        </div>

        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
            {row.map((k, j) => (
              <Key key={`${k}-${j}`} label={caps && !numeric && !symbols ? k.toUpperCase() : k} onPress={() => press(k)} />
            ))}
          </div>
        ))}
        <div className="flex justify-center gap-1.5">
          {!numeric && (
            <>
              <Key label={symbols ? "abc" : "?123"} wide onPress={() => setSymbols((s) => !s)} />
              {!symbols && <Key label={caps ? "⇧ ABC" : "⇧ abc"} wide onPress={() => setCaps((c) => !c)} />}
              <Key label="espaço" grow onPress={() => press(" ")} />
            </>
          )}
          <Key label="⌫" wide onPress={() => press("\b")} />
          <Key label={isTextarea ? "↵" : "OK"} wide onPress={() => press("\n")} />
          <Key
            label="Fechar"
            wide
            onPress={() => {
              fieldRef.current?.blur();
              fieldRef.current = null;
              setField(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Key({
  label,
  onPress,
  wide,
  grow,
}: {
  label: string;
  onPress: () => void;
  wide?: boolean;
  grow?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPress();
      }}
      className={`min-h-11 rounded-xl border border-border bg-background px-2 font-display text-lg text-foreground shadow-sm active:scale-95 ${
        grow ? "flex-1" : wide ? "min-w-20 px-4" : "min-w-11 flex-1"
      }`}
    >
      {label}
    </button>
  );
}
