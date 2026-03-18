import { FormQuestion } from "@/types/database";

export const DEFAULT_FORM_QUESTIONS: FormQuestion[] = [
  {
    id: "rating",
    label: "総合評価",
    type: "star_rating",
    required: true,
  },
  {
    id: "before_story",
    label: "ご利用前はどんなお悩みがありましたか？",
    type: "textarea",
    required: true,
    placeholder: "例：集客がうまくいかず、毎月の売上が安定しませんでした...",
  },
  {
    id: "content",
    label: "ご利用後、どんな変化がありましたか？",
    type: "textarea",
    required: true,
    placeholder: "例：3ヶ月で売上が2倍になり、自信を持って活動できるようになりました...",
  },
  {
    id: "name",
    label: "お名前",
    type: "text",
    required: true,
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
