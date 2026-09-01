const fileInput = document.getElementById("pdfFile");

if (fileInput) {
    fileInput.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) {
            return;
        }

        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.");
            this.value = "";
            return;
        }

        alert("PDF selected successfully: " + file.name);
    });
}
