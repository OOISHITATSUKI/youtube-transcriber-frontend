import { useLang } from '../i18n';

export default function CommercePage() {
  useLang();
  return (
    <div className="legal-page">
      <h1>特定商取引法に基づく表記</h1>

      <table className="commerce-table">
        <tbody>
          <tr><th>販売業者</th><td>合同会社ADLINK</td></tr>
          <tr><th>代表責任者</th><td>大石 樹</td></tr>
          <tr><th>所在地</th><td>〒150-0043 東京都渋谷区道玄坂1丁目10番8号 渋谷道玄坂東急ビル2F-C</td></tr>
          <tr><th>電話番号</th><td>050-3578-1192（受付時間: 平日10:00〜18:00）</td></tr>
          <tr><th>メールアドレス</th><td>info@cawae-laboo.com</td></tr>
          <tr><th>販売URL</th><td>https://yt-transcriber.com</td></tr>
          <tr>
            <th>販売価格</th>
            <td>
              各プランページに表示（税込）<br />
              ・スタータープラン: $1.00（5回分クレジット）<br />
              ・プロプラン: $1.50（10回分クレジット）
            </td>
          </tr>
          <tr><th>商品代金以外の必要料金</th><td>なし</td></tr>
          <tr><th>支払方法</th><td>クレジットカード決済（Stripe）</td></tr>
          <tr><th>支払時期</th><td>購入時に即時決済</td></tr>
          <tr><th>商品の引渡時期</th><td>決済完了後、即時にクレジットが付与されます</td></tr>
          <tr>
            <th>サービス提供上の制限</th>
            <td>現在β版のため、1動画あたり最大8分までの文字起こしとなります。将来的に変更される可能性があります。</td>
          </tr>
          <tr>
            <th>返品・交換について</th>
            <td>デジタルコンテンツの性質上、原則として返品・交換はお受けできません。ただし、当社の重大な過失によりサービスが利用できない場合は、個別に対応いたします。</td>
          </tr>
          <tr><th>動作環境</th><td>最新版のGoogle Chrome、Firefox、Safari、Edge</td></tr>
        </tbody>
      </table>
    </div>
  );
}
