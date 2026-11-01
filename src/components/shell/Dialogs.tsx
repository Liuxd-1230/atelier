import * as Dialog from "@radix-ui/react-dialog";
import { CircleAlert, Keyboard, Trash2, X } from "lucide-react";
import { useApp } from "../../store/AppStore";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "K"], label: "打开快速查找" },
  { keys: ["↑", "↓"], label: "在列表中移动" },
  { keys: ["Enter"], label: "打开选中项" },
  { keys: ["Esc"], label: "关闭面板" },
  { keys: ["Ctrl", "B"], label: "折叠 / 展开侧栏" },
  { keys: ["Ctrl", "D"], label: "切换信息密度" },
  { keys: ["Ctrl", "J"], label: "切换深浅主题" },
];

export function ShortcutsDialog() {
  const { state, dispatch } = useApp();

  return (
    <Dialog.Root
      open={state.shortcutsOpen}
      onOpenChange={(open) => dispatch({ type: "shortcuts", open })}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-scrim backdrop-blur-[2px]" />
        <Dialog.Content
          className="anim-dialog-in fixed left-1/2 top-1/2 z-[61] w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-0 shadow-dialog focus:outline-none"
          aria-label="快捷键"
        >
          <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
            <div>
              <Dialog.Title className="text-[14px] font-medium text-ink">
                快捷键
              </Dialog.Title>
              <Dialog.Description className="mt-[2px] text-[11.5px] text-ink-4">
                在任意页面可用
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="-mr-1 flex size-7 items-center justify-center rounded-md text-ink-4 transition-colors hover:bg-hover hover:text-ink"
                aria-label="关闭"
              >
                <X size={15} strokeWidth={1.9} />
              </button>
            </Dialog.Close>
          </div>
          <div className="border-t border-line px-5 py-2">
            {SHORTCUTS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 py-2"
              >
                <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
                  <Keyboard size={12} strokeWidth={1.8} className="text-ink-4" />
                  {item.label}
                </span>
                <span className="flex items-center gap-1">
                  {item.keys.map((key) => (
                    <span key={key} className="kbd">
                      {key}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <span className="text-[10.5px] text-ink-4">
              输入框聚焦时快捷键不会触发
            </span>
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">
                知道了
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function RemoveDialog() {
  const { state, dispatch } = useApp();
  const model = state.models.find((m) => m.id === state.removeTargetId);

  return (
    <Dialog.Root
      open={model !== undefined}
      onOpenChange={(open) =>
        dispatch({ type: "removeTarget", id: open ? state.removeTargetId : null })
      }
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-scrim backdrop-blur-[2px]" />
        <Dialog.Content
          className="anim-dialog-in fixed left-1/2 top-1/2 z-[61] w-[min(400px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface shadow-dialog focus:outline-none"
          aria-label="移出模型"
        >
          <div className="px-5 pb-4 pt-5">
            <div className="flex size-8 items-center justify-center rounded-full bg-danger-soft text-danger">
              <CircleAlert size={16} strokeWidth={1.9} />
            </div>
            <Dialog.Title className="mt-3 text-[14px] font-medium text-ink">
              将“{model?.shortName}”移出工作台？
            </Dialog.Title>
            <Dialog.Description className="mt-1.5 text-[11.5px] leading-[1.6] text-ink-3">
              模型会从列表中移除，但权重文件仍保留在磁盘上。
              <span className="mono mt-1 block text-[10.5px] text-ink-4">
                {model?.file.path}
              </span>
            </Dialog.Description>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
            <Dialog.Close asChild>
              <Button variant="ghost" size="sm">
                取消
              </Button>
            </Dialog.Close>
            <Button
              variant="danger"
              size="sm"
              className={cn("gap-1.5")}
              onClick={() =>
                model && dispatch({ type: "remove", id: model.id })
              }
            >
              <Trash2 size={12} strokeWidth={2} />
              移出工作台
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
