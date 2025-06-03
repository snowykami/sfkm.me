export default function VSCode() {


  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <iframe
        src="https://vsc.liteyuki.org/?folder=/config/workspace"
        style={{ flex: 1, border: "none", width: "100%" }}
        title="Browser"
        sandbox="allow-scripts allow-same-origin allow-forms allow-credentials"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}