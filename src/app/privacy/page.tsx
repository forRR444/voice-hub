import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "プライバシーポリシー — VoiceHub",
  description: "VoiceHubのプライバシーポリシーです。個人情報の取り扱い、収集方法、利用目的についてご説明します。",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold text-[var(--brand)]">
            <Image src="/logo-icon.png" alt="" width={1047} height={1267} className="h-7 w-auto" />
            VoiceHub
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-gray-400 mb-12">最終更新日: 2026年3月23日</p>
        <div className="space-y-8 text-[15px] text-gray-700 leading-[1.9]">
          <p>
            VoiceHub（以下「当社」といいます。）は、本サービスにおけるユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
          </p>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第1条（個人情報）</h2>
          <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、メールアドレス、その他の記述等により特定の個人を識別できる情報及び容貌等の個人識別符号が含まれる情報を指します。</p>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第2条（個人情報の収集方法）</h2>
          <p>当社は、ユーザーが利用登録をする際に、以下の方法を通じて個人情報を取得します。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>メールアドレスとパスワードによる登録の場合：メールアドレス</li>
            <li>Googleアカウントによる認証（Google OAuth 2.0）の場合：Googleアカウントに登録された氏名、メールアドレス、プロフィール画像</li>
          </ul>
          <p>パスワードは暗号化して保存され、当社がパスワードを直接閲覧することはありません。Googleアカウントの情報の取扱いについては、Google社のプライバシーポリシーもあわせてご確認ください。</p>
          <p>また、ユーザーのお客様（以下「フォーム回答者」といいます。）が収集フォームを通じて送信する情報（氏名、職業・肩書き、写真、感想・評価等）は、ユーザーのアカウントに紐づいて保存されます。</p>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第3条（個人情報を収集・利用する目的）</h2>
          <p>当社が個人情報を収集・利用する目的は以下のとおりです。</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>本サービスの提供・運営のため</li>
            <li>ユーザーからのお問い合わせに回答するため</li>
            <li>ユーザーに対して、サービスに関する重要な通知を行うため</li>
            <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
            <li>ユーザーにご自身の登録情報の閲覧や変更、利用状況の閲覧を行っていただくため</li>
            <li>有料サービスにおける料金の請求のため</li>
            <li>上記の利用目的に付随する目的のため</li>
          </ul>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第4条（フォーム回答者の個人情報）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>フォーム回答者が収集フォームを通じて送信した個人情報については、当該フォームを設置したユーザーが個人情報保護法上の個人情報取扱事業者としての責任を負います。</li>
            <li>当社は、ユーザーの委託に基づき、フォーム回答者の個人情報を保管・処理します。</li>
            <li>当社は、ユーザーのウィジェット設定に基づき、ユーザーが承認したフォーム回答者の情報をユーザーの外部ウェブサイト上に表示します。</li>
            <li>フォーム回答者が自身の個人情報の開示・訂正・削除を希望する場合は、当該フォームを設置したユーザーに直接お問い合わせください。ユーザーの特定が困難な場合は、当社の問い合わせ窓口にご連絡いただくことも可能です。</li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第5条（利用目的の変更）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</li>
            <li>利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。</li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第6条（個人情報の第三者提供）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
              </ul>
            </li>
            <li>
              前項の定めにかかわらず、以下の場合には当該情報の提供先は第三者に該当しないものとします。
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合</li>
                <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第7条（外部サービスの利用）</h2>
          <p>当社は、本サービスの提供にあたり、以下の外部サービスを利用しており、これらのサービス提供元に対して個人情報の取扱いを委託する場合があります。</p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 border-b border-gray-200 font-medium">サービス名</th>
                  <th className="text-left px-4 py-2 border-b border-gray-200 font-medium">提供元</th>
                  <th className="text-left px-4 py-2 border-b border-gray-200 font-medium">利用目的</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b border-gray-100">Supabase</td>
                  <td className="px-4 py-2 border-b border-gray-100">Supabase Inc.（米国）</td>
                  <td className="px-4 py-2 border-b border-gray-100">データベース・認証基盤</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b border-gray-100">Stripe</td>
                  <td className="px-4 py-2 border-b border-gray-100">Stripe Inc.（米国）</td>
                  <td className="px-4 py-2 border-b border-gray-100">決済処理</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b border-gray-100">Vercel</td>
                  <td className="px-4 py-2 border-b border-gray-100">Vercel Inc.（米国）</td>
                  <td className="px-4 py-2 border-b border-gray-100">ホスティング・配信</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b border-gray-100">Google OAuth</td>
                  <td className="px-4 py-2 border-b border-gray-100">Google LLC（米国）</td>
                  <td className="px-4 py-2 border-b border-gray-100">ユーザー認証</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b border-gray-100">Google Analytics</td>
                  <td className="px-4 py-2 border-b border-gray-100">Google LLC（米国）</td>
                  <td className="px-4 py-2 border-b border-gray-100">アクセス解析</td>
                </tr>
                <tr>
                  <td className="px-4 py-2">PostHog</td>
                  <td className="px-4 py-2">PostHog Inc.（米国）</td>
                  <td className="px-4 py-2">アクセス解析・ユーザー行動分析・セッション録画</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>各サービスのプライバシーポリシーについては、各社のウェブサイトをご確認ください。</p>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第8条（個人データの国外移転）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>本サービスにおけるユーザーおよびフォーム回答者の個人データは、本サービスの提供に必要な範囲で、米国に所在するサーバーに保存・処理される場合があります。</li>
            <li>当社は、委託先サービスの選定にあたり、個人情報の保護について適切な措置を講じている事業者であることを確認しています。</li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第9条（Cookieおよびアクセスログ）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>本サービスでは、ユーザーの認証状態の維持およびサービス改善のため、Cookie及びこれに類する技術を使用します。</li>
            <li>当社は、アクセスログ（IPアドレス、ブラウザ種別、アクセス日時等）を収集する場合があります。これらの情報は単独で個人を特定するものではありませんが、サービスの安定運用・不正アクセスの検知等に利用します。</li>
            <li>当社は、サービス改善を目的として、Google Analytics および PostHog を用いてユーザーの操作情報（ページ閲覧、クリック、スクロール等）を収集・分析します。PostHog ではセッション録画（画面操作の録画）を行う場合があります。これらの情報はサービスの品質向上のみに利用し、個人を特定する目的では使用しません。</li>
            <li>ユーザーは、ブラウザの設定によりCookieの受け取りを拒否することができますが、その場合、本サービスの一部機能が利用できなくなることがあります。</li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第10条（個人情報の開示）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                <li>その他法令に違反することとなる場合</li>
              </ul>
            </li>
            <li>前項の定めにかかわらず、履歴情報および特性情報などの個人情報以外の情報については、原則として開示いたしません。</li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第11条（個人情報の訂正および削除）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下「訂正等」といいます。）を請求することができます。</li>
            <li>当社は、ユーザーから前項の請求を受けてその請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。</li>
            <li>当社は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これをユーザーに通知します。</li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第12条（個人情報の利用停止等）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>当社は、本人から、個人情報が利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行います。</li>
            <li>前項の調査結果に基づき、その請求に応じる必要があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。</li>
            <li>当社は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。</li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第13条（プライバシーポリシーの変更）</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</li>
            <li>当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</li>
          </ol>

          <h2 className="text-base font-bold text-gray-900 mt-12 pt-8 border-t border-gray-100">第14条（お問い合わせ窓口）</h2>
          <p>本ポリシーに関するお問い合わせは、本サービスのお問い合わせフォームよりご連絡ください。</p>

          <p className="mt-10 text-sm text-gray-400">以上</p>
        </div>
      </main>
    </div>
  );
}
