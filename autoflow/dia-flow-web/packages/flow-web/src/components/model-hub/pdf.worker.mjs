import worker from "pdfjs-dist/es5/build/pdf.worker.min.js"

(typeof window !== "undefined"
  ? window
  : {}
).pdfjsWorker = worker;
