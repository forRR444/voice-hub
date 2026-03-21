import type { Metadata } from "next";
import { FormClient } from "../[slug]/form-client";
import type { FormRow } from "@/types/database";

export const metadata: Metadata = {
  title: "田中コーチングサロン — お客様の声フォーム（デモ）",
  description:
    "VoiceHubの収集フォームのデモです。実際のデータは送信されません。",
};

const DEMO_FORM: FormRow = {
  id: "demo",
  workspace_id: "demo",
  slug: "demo",
  title: "田中コーチングサロン",
  description:
    "ご利用いただきありがとうございます。ぜひご感想をお聞かせください。",
  brand_color: "#635BFF",
  logo_url: null,
  thank_you_message:
    "ご回答ありがとうございました！これはデモフォームです。実際のデータは送信されていません。",
  questions: [
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
      placeholder:
        "例：集客がうまくいかず、毎月の売上が安定しませんでした...",
    },
    {
      id: "content",
      label: "ご利用後、どんな変化がありましたか？",
      type: "textarea",
      required: true,
      placeholder:
        "例：3ヶ月で売上が2倍になり、自信を持って活動できるようになりました...",
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
  ],
  created_at: new Date().toISOString(),
};

export default function DemoFormPage() {
  return <FormClient form={DEMO_FORM} demo />;
}
