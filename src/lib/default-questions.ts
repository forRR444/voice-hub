import { FormQuestion } from "@/types/database";

export const CORE_QUESTION_IDS = ["rating", "content", "name", "permission"];

export type FormTemplate = {
  id: string;
  label: string;
  description: string;
  questions: FormQuestion[];
};

// 共通の質問（全テンプレートで使う）
const COMMON_START: FormQuestion[] = [
  {
    id: "rating",
    label: "総合評価",
    type: "star_rating",
    required: true,
  },
];

const COMMON_END: FormQuestion[] = [
  {
    id: "name",
    label: "お名前",
    type: "text",
    required: false,
    placeholder: "山田 太郎",
  },
  {
    id: "title",
    label: "ご職業・肩書き",
    type: "text",
    required: false,
    placeholder: "例：ライフコーチ",
  },
  {
    id: "avatar",
    label: "お写真",
    type: "image",
    required: false,
  },
  {
    id: "permission",
    label: "Webサイトやプロフィールへの掲載を許可しますか？",
    type: "checkbox",
    required: true,
  },
];

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "coaching",
    label: "コーチング・コンサル",
    description: "コーチ、コンサルタント、カウンセラー向け",
    questions: [
      ...COMMON_START,
      {
        id: "before_story",
        label: "ご利用前はどんなお悩みがありましたか？",
        type: "textarea",
        required: false,
        placeholder: "例：集客がうまくいかず、毎月の売上が安定しませんでした...",
      },
      {
        id: "content",
        label: "ご利用後、どんな変化がありましたか？",
        type: "textarea",
        required: true,
        placeholder: "例：3ヶ月で売上が2倍になり、自信を持って活動できるようになりました...",
      },
      ...COMMON_END,
    ],
  },
  {
    id: "course",
    label: "オンライン講座",
    description: "オンライン講座、セミナー、ワークショップ向け",
    questions: [
      ...COMMON_START,
      {
        id: "before_story",
        label: "受講前はどんな課題がありましたか？",
        type: "textarea",
        required: false,
        placeholder: "例：独学で勉強していましたが、なかなか成果が出ませんでした...",
      },
      {
        id: "content",
        label: "受講して一番良かったことは何ですか？",
        type: "textarea",
        required: true,
        placeholder: "例：体系的に学べたことで、すぐに実践に活かせました...",
      },
      ...COMMON_END,
    ],
  },
  {
    id: "therapy",
    label: "セラピスト・施術",
    description: "整体、鍼灸、エステ、リラクゼーション向け",
    questions: [
      ...COMMON_START,
      {
        id: "before_story",
        label: "施術前はどんな症状やお悩みがありましたか？",
        type: "textarea",
        required: false,
        placeholder: "例：肩こりがひどく、頭痛に悩まされていました...",
      },
      {
        id: "content",
        label: "施術後、どんな変化を感じましたか？",
        type: "textarea",
        required: true,
        placeholder: "例：1回の施術で肩が軽くなり、3回通った頃には頭痛もなくなりました...",
      },
      ...COMMON_END,
    ],
  },
  {
    id: "freelance",
    label: "フリーランス・制作",
    description: "デザイナー、ライター、エンジニア、写真家向け",
    questions: [
      ...COMMON_START,
      {
        id: "content",
        label: "依頼してよかった点を教えてください",
        type: "textarea",
        required: true,
        placeholder: "例：デザインのクオリティが高く、レスポンスも早くて安心でした...",
      },
      {
        id: "before_story",
        label: "依頼前に不安だったことはありますか？",
        type: "textarea",
        required: false,
        placeholder: "例：イメージ通りに仕上がるか心配でした...",
      },
      ...COMMON_END,
    ],
  },
  {
    id: "general",
    label: "汎用",
    description: "どの業種でも使えるシンプルな質問セット",
    questions: [
      ...COMMON_START,
      {
        id: "content",
        label: "ご感想をお聞かせください",
        type: "textarea",
        required: true,
        placeholder: "サービスや商品についてのご感想をお書きください...",
      },
      ...COMMON_END,
    ],
  },
];

// デフォルトテンプレート（コーチング）
export const DEFAULT_FORM_QUESTIONS: FormQuestion[] = FORM_TEMPLATES[0].questions;
