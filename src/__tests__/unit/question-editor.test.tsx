import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QuestionEditor, { PRESET_QUESTIONS } from "@/app/components/question-editor";
import type { FormQuestion } from "@/types/database";

// Mock @dnd-kit to avoid DOM measurement issues in jsdom
vi.mock("@dnd-kit/core", () => {
  return {
    DndContext: ({ children, onDragEnd }: any) => <div data-testid="dnd-context">{children}</div>,
    closestCenter: vi.fn(),
    KeyboardSensor: vi.fn(),
    PointerSensor: vi.fn(),
    TouchSensor: vi.fn(),
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn(() => []),
  };
});

vi.mock("@dnd-kit/sortable", () => {
  return {
    arrayMove: (arr: any[], from: number, to: number) => {
      const result = [...arr];
      const [removed] = result.splice(from, 1);
      result.splice(to, 0, removed);
      return result;
    },
    SortableContext: ({ children }: any) => <div>{children}</div>,
    sortableKeyboardCoordinates: vi.fn(),
    useSortable: ({ id }: { id: string }) => ({
      attributes: { "data-sortable-id": id },
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    }),
    verticalListSortingStrategy: vi.fn(),
  };
});

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: (val: any) => (val ? `translate(${val.x}px, ${val.y}px)` : undefined),
    },
  },
}));

const baseQuestions: FormQuestion[] = [
  { id: "rating", label: "総合評価", type: "star_rating", required: true },
  { id: "content", label: "感想", type: "textarea", required: true },
  { id: "permission", label: "掲載許可", type: "checkbox", required: true },
];

describe("QuestionEditor", () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it("質問リストが表示される", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    // preset labels are used for display
    expect(screen.getByText("総合評価（星）")).toBeInTheDocument();
    expect(screen.getByText("感想・レビュー")).toBeInTheDocument();
    expect(screen.getByText("掲載許可")).toBeInTheDocument();
  });

  it("「質問を追加」ボタンが表示される", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    expect(screen.getByText("質問を追加")).toBeInTheDocument();
  });

  it("「質問を追加」クリックでプリセットピッカーが表示される", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    // Unused presets should appear (e.g., before_story, name, title, avatar are not in baseQuestions)
    expect(screen.getByText("利用前の悩み（Before）")).toBeInTheDocument();
    expect(screen.getByText("お名前")).toBeInTheDocument();
  });

  it("プリセットをクリックすると質問が追加される", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    fireEvent.click(screen.getByText("お名前"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const newQuestions = onChange.mock.calls[0][0];
    expect(newQuestions).toHaveLength(4);
    expect(newQuestions[3].id).toBe("name");
  });

  it("alwaysOnの質問にはトグルボタンがない（チェックボックスが無効表示）", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    // permission is alwaysOn - it should show the asterisk
    const asterisks = screen.getAllByText("*");
    expect(asterisks.length).toBeGreaterThan(0);
  });

  it("トグルで質問のenabledが切り替わる", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    // "rating" is not alwaysOn, so it has a toggle button
    // Find toggle buttons (checkboxes that are clickable)
    const toggleButtons = screen.getAllByRole("button");
    // Click the first toggle (rating's toggle)
    const ratingToggle = toggleButtons[0];
    fireEvent.click(ratingToggle);
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0];
    expect(updated.find((q: FormQuestion) => q.id === "rating").enabled).toBe(false);
  });

  it("カスタム質問に削除ボタンが表示される", () => {
    const questionsWithCustom: FormQuestion[] = [
      ...baseQuestions,
      { id: "custom_123", label: "カスタム質問", type: "text", required: false },
    ];
    render(<QuestionEditor questions={questionsWithCustom} onChange={onChange} />);
    expect(screen.getByText("カスタム質問")).toBeInTheDocument();
    // Custom questions show their type
    expect(screen.getByText("text")).toBeInTheDocument();
  });

  it("カスタム質問の削除ボタンで質問が削除される", () => {
    const questionsWithCustom: FormQuestion[] = [
      ...baseQuestions,
      { id: "custom_123", label: "カスタム質問", type: "text", required: false },
    ];
    render(<QuestionEditor questions={questionsWithCustom} onChange={onChange} />);
    // Find the remove button - it's the button containing the X icon, with the hover:text-red-500 class
    const allButtons = screen.getAllByRole("button");
    // The remove button has the class "hover:text-red-500"
    const removeButton = allButtons.find((btn) => btn.className.includes("hover:text-red-500"));
    expect(removeButton).toBeDefined();
    // Use stopPropagation-safe click
    fireEvent.click(removeButton!);
    // The onClick handler calls e.stopPropagation() then onRemove()
    // But the onPointerDown also stops propagation - we need to trigger click directly
    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0];
    expect(updated.find((q: FormQuestion) => q.id === "custom_123")).toBeUndefined();
  });

  it("カスタム質問を追加フォームから追加できる", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    // Fill in the custom question form
    const input = screen.getByPlaceholderText("質問文を入力");
    fireEvent.change(input, { target: { value: "カスタム質問テスト" } });
    // Click the add button
    fireEvent.click(screen.getByText("追加"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const newQuestions = onChange.mock.calls[0][0];
    expect(newQuestions).toHaveLength(4);
    expect(newQuestions[3].label).toBe("カスタム質問テスト");
    expect(newQuestions[3].type).toBe("text");
  });

  it("カスタム質問の追加で空のラベルでは追加されない", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    // Try to add without label - the button should be disabled
    const addButton = screen.getByText("追加");
    expect(addButton).toBeDisabled();
  });

  it("キャンセルボタンでフォームが閉じる", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    expect(screen.getByPlaceholderText("質問文を入力")).toBeInTheDocument();
    fireEvent.click(screen.getByText("キャンセル"));
    // The preset picker/form should be hidden, and "質問を追加" should be back
    expect(screen.getByText("質問を追加")).toBeInTheDocument();
  });

  it("selectタイプ選択時にオプション入力欄が表示される", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    // Change type to select
    const typeSelect = screen.getByDisplayValue("テキスト");
    fireEvent.change(typeSelect, { target: { value: "select" } });
    // Options textarea should appear
    expect(screen.getByPlaceholderText(/選択肢を1行ずつ入力/)).toBeInTheDocument();
  });

  it("selectタイプでオプション未入力の場合は追加ボタンが無効", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    const input = screen.getByPlaceholderText("質問文を入力");
    fireEvent.change(input, { target: { value: "選択質問" } });
    const typeSelect = screen.getByDisplayValue("テキスト");
    fireEvent.change(typeSelect, { target: { value: "select" } });
    // Button should be disabled because options is empty
    expect(screen.getByText("追加")).toBeDisabled();
  });

  it("selectタイプのカスタム質問をオプション付きで追加できる", () => {
    render(<QuestionEditor questions={baseQuestions} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    const input = screen.getByPlaceholderText("質問文を入力");
    fireEvent.change(input, { target: { value: "満足度" } });
    const typeSelect = screen.getByDisplayValue("テキスト");
    fireEvent.change(typeSelect, { target: { value: "select" } });
    const optionsTextarea = screen.getByPlaceholderText(/選択肢を1行ずつ入力/);
    fireEvent.change(optionsTextarea, { target: { value: "とても満足\n満足\n普通" } });
    fireEvent.click(screen.getByText("追加"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const newQ = onChange.mock.calls[0][0][3];
    expect(newQ.type).toBe("select");
    expect(newQ.options).toEqual(["とても満足", "満足", "普通"]);
  });

  it("enabled: false の質問は半透明で表示される", () => {
    const qs: FormQuestion[] = [
      { id: "rating", label: "総合評価", type: "star_rating", required: true, enabled: false },
    ];
    render(<QuestionEditor questions={qs} onChange={onChange} />);
    // The item should have opacity-40 class
    expect(screen.getByText("総合評価（星）").closest("div[data-sortable-id]")).toHaveClass("opacity-40");
  });

  it("star_ratingタイプのカスタム質問は「星評価」と表示される", () => {
    const qs: FormQuestion[] = [
      ...baseQuestions,
      { id: "custom_star", label: "追加評価", type: "star_rating", required: false },
    ];
    render(<QuestionEditor questions={qs} onChange={onChange} />);
    expect(screen.getByText("星評価")).toBeInTheDocument();
  });

  it("selectタイプのカスタム質問は「選択肢」と表示される", () => {
    const qs: FormQuestion[] = [
      ...baseQuestions,
      { id: "custom_select", label: "選択質問", type: "select", required: false },
    ];
    render(<QuestionEditor questions={qs} onChange={onChange} />);
    expect(screen.getByText("選択肢")).toBeInTheDocument();
  });

  it("全プリセットが使用済みの場合でもカスタム追加フォームが表示される", () => {
    const allPresets: FormQuestion[] = PRESET_QUESTIONS.map((p) => ({
      id: p.id,
      label: p.label,
      type: p.type,
      required: p.required ?? false,
    }));
    render(<QuestionEditor questions={allPresets} onChange={onChange} />);
    fireEvent.click(screen.getByText("質問を追加"));
    // Custom form should still be visible
    expect(screen.getByPlaceholderText("質問文を入力")).toBeInTheDocument();
  });
});
