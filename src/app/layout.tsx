import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthHashHandler } from "@/components/AuthHashHandler";

const GA_ID = "G-NVM52S3EHT";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ilanlarcebimde.com"),
  title:
    "Yurtdışı İş İlanları ve Başvuru Merkezi | CV Hazırla, Başvuru Mektubu Oluştur, Hemen Başvur",
  verification: {
    google: "X2phO_avup8oTuO-zNe9REuy7ZVfOXktMsaPJ2mOitA",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  description:
    "Yurtdışı iş ilanları, firma iletişim bilgileri, iş başvuru mektubu oluşturma, İngilizce CV hazırlama ve başvuru rehberi tek platformda. İlanlar Cebimde ile uluslararası kariyer fırsatlarına hızlı ve güvenilir erişim sağlayın.",
  keywords:
    "yurtdışı iş ilanları, yurtdışı iş başvurusu, İngilizce CV hazırlama, başvuru mektubu oluşturma, yurtdışı kariyer, usta başvuru, ilan analizi, Almanya, Hollanda, inşaat, elektrik, seramik",
  openGraph: {
    title:
      "Yurtdışı İş İlanları ve Başvuru Merkezi | CV Hazırla, Başvuru Mektubu Oluştur, Hemen Başvur",
    description:
      "Yurtdışı iş ilanları, firma iletişim bilgileri, iş başvuru mektubu oluşturma, İngilizce CV hazırlama ve başvuru rehberi tek platformda. İlanlar Cebimde ile uluslararası kariyer fırsatlarına hızlı ve güvenilir erişim sağlayın.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <meta name="google-adsense-account" content="ca-pub-3494435772981222" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css"
        />
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3494435772981222"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
          async
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="antialiased font-sans bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
        <AuthHashHandler />
        {children}
        <div id="n8n-chat" />
        <Script id="n8n-chat-init" strategy="afterInteractive" type="module">
          {`
            if (!window.__ilanlarCebimdeN8nChatInitialized) {
              window.__ilanlarCebimdeN8nChatInitialized = true;

              var LOGO_URL = "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/logo21.jpg";

              import("https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js")
                .then(({ createChat }) => {
                  createChat({
                    webhookUrl: "https://s02c0alq.rcld.app/webhook/8cdedc3b-fbaa-47f3-b118-76e0c3da64f0/chat",
                    target: "#n8n-chat",
                    mode: "window",
                    chatInputKey: "chatInput",
                    chatSessionKey: "sessionId",
                    loadPreviousSession: true,
                    showWelcomeScreen: true,
                    defaultLanguage: "tr",
                    enableStreaming: true,
                    metadata: {
                      source: "ilanlar-cebimde-web",
                      locale: "tr",
                      platform: "ilanlar-cebimde"
                    },
                    initialMessages: [
                      "İlanlar Cebimde, yurtdışında iş bulmak isteyenler için araştırmalar yapan ve başvuru süreçlerinde yardımcı çözümler sunan bir platformdur.",
                      "Platform hizmetleri, premium özellikler, iş başvuruları, CV hazırlama veya başvuru süreçleri hakkında merak ettiğiniz konularda size yardımcı olabiliriz.",
                      "Sorunuzu yazabilirsiniz. Canlı destek üzerinden size yardımcı olmaktan memnuniyet duyarız."
                    ],
                    i18n: {
                      tr: {
                        title: "İlanlar Cebimde Destek",
                        subtitle: "Başvuru araçları, premium özellikler ve platform kullanımı hakkında hızlı yardım alın.",
                        footer: "",
                        getStarted: "Yeni Sohbet Başlat",
                        inputPlaceholder: "Sorunuzu buraya yazın..."
                      }
                    }
                  });

                  function injectCustomHeader() {
                    var root = document.querySelector("#n8n-chat");
                    if (!root) return;
                    var header = root.querySelector(".chat-header");
                    if (!header) return;
                    if (header.querySelector(".ilanlar-header-row")) return;
                    var wrapper = document.createElement("div");
                    wrapper.className = "ilanlar-header-row";
                    wrapper.innerHTML = "<div class=\\"ilanlar-logo-wrap\\"><img class=\\"ilanlar-logo\\" src=\\"\" + LOGO_URL + "\\" alt=\\"İlanlar Cebimde Logo\\" /></div><div class=\\"ilanlar-header-text\\"><strong>İlanlar Cebimde Destek</strong><span>Başvuru araçları, premium özellikler ve platform kullanımı hakkında hızlı yardım alın.</span></div>";
                    header.prepend(wrapper);
                  }

                  var root = document.querySelector("#n8n-chat");
                  var observer = new MutationObserver(function () { injectCustomHeader(); });
                  if (root) observer.observe(root, { childList: true, subtree: true });
                  requestAnimationFrame(function () { injectCustomHeader(); });
                  setTimeout(function () { injectCustomHeader(); }, 300);
                  setTimeout(function () { injectCustomHeader(); }, 1000);
                })
                .catch((error) => {
                  console.error("n8n chat widget could not be initialized", error);
                });
            }
          `}
        </Script>
        <Script id="ilanlar-chat-fixes" strategy="afterInteractive">
          {`
            (function() {
              function cleanWrongToggleClass() {
                document.querySelectorAll(".chat-input-send-button.ilanlar-custom-toggle").forEach(function(btn) {
                  btn.classList.remove("ilanlar-custom-toggle");
                  btn.removeAttribute("style");
                });
              }

              function syncChatToggleState() {
                var wrapper = document.querySelector(".n8n-chat .chat-window-wrapper");
                var chatWindow = document.querySelector(".n8n-chat .chat-window");
                if (!wrapper || !chatWindow) return;
                var isOpen = window.getComputedStyle(chatWindow).display !== "none";
                wrapper.classList.toggle("ilanlar-chat-open", isOpen);
              }

              function runFixes() {
                cleanWrongToggleClass();
                syncChatToggleState();
              }

              /* Jülide yazıyor — typing göstergesi */
              function showTyping() {
                var list = document.querySelector(".n8n-chat .chat-messages-list");
                if (!list) return;
                if (document.querySelector(".julide-typing")) return;
                var typing = document.createElement("div");
                typing.className = "chat-message chat-message-from-bot julide-typing";
                typing.innerHTML = "<span>Jülide yazıyor</span><div class=\\"typing-dots\\"><div></div><div></div><div></div></div>";
                list.appendChild(typing);
              }

              function removeTyping() {
                var typing = document.querySelector(".julide-typing");
                if (typing) typing.remove();
              }

              /* Sadece kullanıcı gönderdikten sonra gelen mesaja animasyon uygula */
              var userJustSent = false;

              document.addEventListener("click", function(e) {
                if (e.target.closest(".chat-input-send-button")) {
                  userJustSent = true;
                  showTyping();
                }
              });

              /* Enter tuşu ile gönderim */
              document.addEventListener("keydown", function(e) {
                if (e.key === "Enter" && !e.shiftKey) {
                  var textarea = document.querySelector(".n8n-chat .chat-input textarea");
                  if (document.activeElement === textarea && textarea.value.trim()) {
                    userJustSent = true;
                    showTyping();
                  }
                }
              });

              /* Harf harf yazma efekti — setInterval tabanlı, stabil */
              function typeWriter(element, text, speed) {
                speed = speed || 20;
                var i = 0;
                element.textContent = "";
                var timer = setInterval(function() {
                  element.textContent += text.charAt(i);
                  i++;
                  if (i >= text.length) clearInterval(timer);
                }, speed);
              }

              /* WeakSet ile her mesaj sadece bir kez işlenir → double-trigger yok */
              var processedMessages = new WeakSet();

              var typingObserver = new MutationObserver(function() {
                document.querySelectorAll(".n8n-chat .chat-message-from-bot").forEach(function(msg) {
                  if (msg.classList.contains("julide-typing")) return;
                  if (processedMessages.has(msg)) return;
                  processedMessages.add(msg);
                  /* initialMessages animasyonsuz geçsin */
                  if (!userJustSent) return;
                  var text = msg.innerText;
                  removeTyping();
                  setTimeout(function() {
                    typeWriter(msg, text, 22);
                    userJustSent = false;
                  }, 700);
                });
              });
              typingObserver.observe(document.body, { childList: true, subtree: true });

              var observer = new MutationObserver(function() { runFixes(); });
              observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["style", "class"]
              });
              if (document.readyState === "complete") runFixes();
              else window.addEventListener("load", runFixes);
              setTimeout(runFixes, 300);
              setTimeout(runFixes, 1000);
              setTimeout(runFixes, 2000);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
