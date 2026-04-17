package openapidoc

import (
	"fmt"
	"strings"
)

// RenderScalarStaticHTML 生成内嵌 OpenAPI JSON 的静态 Scalar HTML 页面。
func RenderScalarStaticHTML(specJSON []byte) string {
	escapedSpec := escapeEmbeddedSpec(specJSON)

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Decision Agent API Reference</title>
  <link rel="icon" type="image/png" href="favicon.png" />
  <style>
    %s
  </style>
</head>
<body>
  %s
  <noscript>Scalar requires JavaScript to render the API reference.</noscript>
  <script>
    %s
  </script>
  <script>
    %s
  </script>
  <script type="application/json" id="openapi-document">%s</script>
  <script>
    (() => {
      const specElement = document.getElementById("openapi-document");
      const referenceElement = document.createElement("script");
      const specBlob = new Blob([specElement.textContent], { type: "application/json" });
      const specURL = URL.createObjectURL(specBlob);
      referenceElement.id = "api-reference";
      referenceElement.dataset.url = specURL;
      document.body.appendChild(referenceElement);
      window.addEventListener("pagehide", () => URL.revokeObjectURL(specURL), { once: true });
    })();
  </script>
  <script src="%s"></script>
</body>
</html>
`, DocsPageStyle(), DocsNavHTML("scalar", staticScalarPagePath, staticRedocPagePath), DocsBootstrapScript(), ScalarPageEnhancementScript(), escapedSpec, staticScalarJSPath)
}

// RenderRedocStaticHTML 生成内嵌 OpenAPI JSON 的静态 Redoc HTML 页面。
func RenderRedocStaticHTML(specJSON []byte) string {
	escapedSpec := escapeEmbeddedSpec(specJSON)

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Decision Agent API Reference</title>
  <link rel="icon" type="image/png" href="favicon.png" />
  <style>
    %s
  </style>
</head>
<body>
  %s
  <noscript>Redoc requires JavaScript to render the API reference.</noscript>
  <script>
    %s
  </script>
  <script type="application/json" id="openapi-document">%s</script>
  <div id="redoc-container"></div>
  <script src="%s"></script>
  <script>
    %s
  </script>
</body>
</html>
`, DocsPageStyle(), DocsNavHTML("redoc", staticScalarPagePath, staticRedocPagePath), DocsBootstrapScript(), escapedSpec, staticRedocJSPath, RedocInitScript(`JSON.parse(document.getElementById("openapi-document").textContent)`))
}

func escapeEmbeddedSpec(specJSON []byte) string {
	return strings.ReplaceAll(string(specJSON), "</script", `<\/script`)
}
