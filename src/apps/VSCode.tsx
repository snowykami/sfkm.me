import { useEffect, useState, useRef } from "react";
import { AppProps } from "./BaseApp";

export default function Vscode({ windowId }: AppProps) {
  const [url, setUrl] = useState<string>("https://vsc.liteyuki.org");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // 当组件挂载时，尝试从 localStorage 恢复 URL
  useEffect(() => {
    const savedUrl = localStorage.getItem(`vscode-url-${windowId}`);
    if (savedUrl) {
      setUrl(savedUrl);
    }
    
    // 注册窗口关闭前的保存事件
    const handleBeforeUnload = () => {
      try {
        if (iframeRef.current?.contentWindow?.location.href) {
          localStorage.setItem(`vscode-url-${windowId}`, 
                              iframeRef.current.contentWindow.location.href);
        }
      } catch (e) {
        // 忽略跨域错误
        console.log("无法保存 URL，可能是跨域限制", e);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [windowId]);
  
  // 监听 iframe 内部导航，并保存新 URL
  const handleIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      // 尝试获取 iframe 当前 URL
      const currentUrl = event.currentTarget.contentWindow?.location.href;
      if (currentUrl && currentUrl !== "about:blank") {
        localStorage.setItem(`vscode-url-${windowId}`, currentUrl);
        setUrl(currentUrl);
      }
    } catch (error) {
      console.log("无法访问 iframe URL，可能是跨域限制", error);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <iframe
        ref={iframeRef}
        src={url}
        style={{ flex: 1, border: "none", width: "100%" }}
        title="vscode"
        // 更完整的 sandbox 设置
        sandbox="allow-scripts allow-same-origin allow-forms allow-credentials allow-popups allow-storage-access-by-user-activation allow-modals"
        // 设置合适的 referrer 策略
        referrerPolicy="origin"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}