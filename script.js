/* =========================================================
   DIGITAL TO PRINTABLE
   COMPLETE SCRIPT
========================================================= */


/* =========================================================
   PDF.JS WORKER
========================================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/* =========================================================
   VARIABLES
========================================================= */

let pdfDocument = null;

let slides = [];

let deletedHistory = [];

let selectedSlideIds = new Set();

let slideCounter = 0;


/* =========================================================
   ELEMENTS
========================================================= */

const fileInput = document.getElementById("pdfFile");
const fileName = document.getElementById("fileName");

const totalSlides = document.getElementById("totalSlides");
const selectedSlides = document.getElementById("selectedSlides");
const slidesPerPageInfo =
    document.getElementById("slidesPerPageInfo");
const paperSaving = document.getElementById("paperSaving");

const slidesContainer =
    document.getElementById("slidesContainer");

const selectAllBtn =
    document.getElementById("selectAllBtn");

const clearAllBtn =
    document.getElementById("clearAllBtn");

const deleteBtn =
    document.getElementById("deleteBtn");

const undoBtn =
    document.getElementById("undoBtn");

const slidesPerPage =
    document.getElementById("slidesPerPage");

const paperSize =
    document.getElementById("paperSize");

const orientation =
    document.getElementById("orientation");

const margin =
    document.getElementById("margin");

const spacing =
    document.getElementById("spacing");

const marginValue =
    document.getElementById("marginValue");

const spacingValue =
    document.getElementById("spacingValue");

const border =
    document.getElementById("border");

const previewContainer =
    document.getElementById("previewContainer");

const generateBtn =
    document.getElementById("generateBtn");

const statusMessage =
    document.getElementById("statusMessage");


/* =========================================================
   INITIAL STATE
========================================================= */

updateInformation();
updateGenerateButton();
updatePreview();


/* =========================================================
   PDF UPLOAD
========================================================= */

fileInput.addEventListener("change", handlePDFUpload);


async function handlePDFUpload(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }


    /* Check file */

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        alert("Please select a valid PDF file.");

        fileInput.value = "";

        return;
    }


    /* Reset */

    pdfDocument = null;

    slides = [];

    deletedHistory = [];

    selectedSlideIds.clear();

    slideCounter = 0;


    fileName.textContent =
        "📄 " + file.name;

    statusMessage.textContent =
        "⏳ Loading PDF...";

    slidesContainer.innerHTML =
        '<div class="loading">Loading PDF...</div>';

    generateBtn.disabled = true;


    try {

        const arrayBuffer =
            await file.arrayBuffer();


        const loadingTask =
            pdfjsLib.getDocument({
                data: arrayBuffer
            });


        pdfDocument =
            await loadingTask.promise;


        totalSlides.textContent =
            pdfDocument.numPages;


        statusMessage.textContent =
            "⏳ Rendering slides...";


        await renderAllSlides();


        /*
         * Automatically select every slide
         * after PDF upload.
         */

        slides.forEach(slide => {

            selectedSlideIds.add(
                slide.id
            );

        });


        updateSlideVisuals();

        updateInformation();

        updateGenerateButton();

        updatePreview();


        statusMessage.textContent =
            "✅ PDF loaded successfully.";


    } catch (error) {

        console.error(error);

        pdfDocument = null;

        slides = [];

        selectedSlideIds.clear();

        slidesContainer.innerHTML =
            '<div class="empty-message">Unable to read this PDF.</div>';

        previewContainer.innerHTML =
            '<div class="empty-message">Print preview will appear here.</div>';

        statusMessage.textContent =
            "❌ PDF could not be loaded.";

        alert(
            "PDF load error. Please try another PDF."
        );
    }
}


/* =========================================================
   RENDER ALL SLIDES
========================================================= */

async function renderAllSlides() {

    slidesContainer.innerHTML = "";

    for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber++
    ) {

        await renderSlide(pageNumber);
    }
}


/* =========================================================
   RENDER SINGLE SLIDE
========================================================= */

async function renderSlide(pageNumber) {

    const page =
        await pdfDocument.getPage(pageNumber);


    const viewport =
        page.getViewport({
            scale: 1
        });


    const maxWidth = 500;

    const scale =
        Math.min(
            1.5,
            maxWidth / viewport.width
        );


    const scaledViewport =
        page.getViewport({
            scale: scale
        });


    const canvas =
        document.createElement("canvas");


    const context =
        canvas.getContext("2d");


    canvas.width =
        Math.ceil(scaledViewport.width);

    canvas.height =
        Math.ceil(scaledViewport.height);


    await page.render({

        canvasContext: context,

        viewport: scaledViewport

    }).promise;


    const slide = {

        id: ++slideCounter,

        pageNumber: pageNumber,

        canvas: canvas

    };


    slides.push(slide);

    createSlideCard(slide);
}


/* =========================================================
   CREATE SLIDE CARD
========================================================= */

function createSlideCard(slide) {

    const card =
        document.createElement("div");

    card.className =
        "slide-card";

    card.dataset.id =
        slide.id;


    const check =
        document.createElement("div");

    check.className =
        "slide-check";

    check.textContent =
        "✓";


    const number =
        document.createElement("div");

    number.className =
        "slide-number";

    number.textContent =
        "Slide " + slide.pageNumber;


    card.appendChild(check);

    card.appendChild(slide.canvas);

    card.appendChild(number);


    card.addEventListener(
        "click",
        function () {

            toggleSlide(slide.id);

        }
    );


    slidesContainer.appendChild(card);
}


/* =========================================================
   TOGGLE SLIDE
========================================================= */

function toggleSlide(id) {

    if (selectedSlideIds.has(id)) {

        selectedSlideIds.delete(id);

    } else {

        selectedSlideIds.add(id);
    }


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();

    updatePreview();
}


/* =========================================================
   UPDATE SLIDE VISUALS
========================================================= */

function updateSlideVisuals() {

    const cards =
        document.querySelectorAll(
            ".slide-card"
        );


    cards.forEach(card => {

        const id =
            Number(card.dataset.id);


        if (selectedSlideIds.has(id)) {

            card.classList.add("selected");

        } else {

            card.classList.remove("selected");
        }

    });
}


/* =========================================================
   SELECT ALL
========================================================= */

selectAllBtn.addEventListener(
    "click",
    selectAllSlides
);


function selectAllSlides() {

    selectedSlideIds.clear();


    slides.forEach(slide => {

        selectedSlideIds.add(
            slide.id
        );

    });


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();

    updatePreview();
}


/* =========================================================
   CLEAR ALL
========================================================= */

clearAllBtn.addEventListener(
    "click",
    clearAllSlides
);


function clearAllSlides() {

    selectedSlideIds.clear();


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();

    updatePreview();
}


/* =========================================================
   DELETE SELECTED
========================================================= */

deleteBtn.addEventListener(
    "click",
    deleteSelectedSlides
);


function deleteSelectedSlides() {

    if (selectedSlideIds.size === 0) {

        alert(
            "Please select slides to delete."
        );

        return;
    }


    const deletedSlides =
        slides.filter(slide =>
            selectedSlideIds.has(
                slide.id
            )
        );


    deletedHistory.push(
        deletedSlides
    );


    slides =
        slides.filter(slide =>
            !selectedSlideIds.has(
                slide.id
            )
        );


    selectedSlideIds.clear();


    redrawSlides();

    updateInformation();

    updateGenerateButton();

    updatePreview();


    statusMessage.textContent =
        "🗑️ Selected slides deleted.";
}


/* =========================================================
   UNDO
========================================================= */

undoBtn.addEventListener(
    "click",
    undoDelete
);


function undoDelete() {

    if (deletedHistory.length === 0) {

        alert(
            "Nothing to undo."
        );

        return;
    }


    const lastDeleted =
        deletedHistory.pop();


    slides.push(
        ...lastDeleted
    );


    slides.sort(
        (a, b) =>
            a.pageNumber - b.pageNumber
    );


    redrawSlides();

    updateInformation();

    updateGenerateButton();

    updatePreview();


    statusMessage.textContent =
        "↩️ Delete undone.";
}


/* =========================================================
   REDRAW SLIDES
========================================================= */

function redrawSlides() {

    slidesContainer.innerHTML = "";


    if (slides.length === 0) {

        slidesContainer.innerHTML =
            '<div class="empty-message">No slides available.</div>';

        return;
    }


    slides.forEach(
        createSlideCard
    );


    updateSlideVisuals();
}


/* =========================================================
   INFORMATION
========================================================= */

function updateInformation() {

    selectedSlides.textContent =
        selectedSlideIds.size;


    const perPage =
        Number(
            slidesPerPage.value
        );


    slidesPerPageInfo.textContent =
        perPage;


    if (slides.length === 0) {

        paperSaving.textContent =
            "0%";

        return;
    }


    const printablePages =
        Math.ceil(
            slides.length / perPage
        );


    const saving =
        Math.max(
            0,
            Math.round(
                (
                    1 -
                    printablePages /
                    slides.length
                ) * 100
            )
        );


    paperSaving.textContent =
        saving + "%";
}


/* =========================================================
   GENERATE BUTTON
========================================================= */

function updateGenerateButton() {

    generateBtn.disabled =
        slides.length === 0 ||
        selectedSlideIds.size === 0;
}


/* =========================================================
   SETTINGS EVENTS
========================================================= */

slidesPerPage.addEventListener(
    "change",
    function () {

        updateInformation();
        updatePreview();

    }
);


margin.addEventListener(
    "input",
    function () {

        marginValue.textContent =
            margin.value;

        updatePreview();

    }
);


spacing.addEventListener(
    "input",
    function () {

        spacingValue.textContent =
            spacing.value;

        updatePreview();

    }
);


paperSize.addEventListener(
    "change",
    updatePreview
);


orientation.addEventListener(
    "change",
    updatePreview
);


border.addEventListener(
    "change",
    updatePreview
);


document
    .querySelectorAll(
        'input[name="printMode"]'
    )
    .forEach(input => {

        input.addEventListener(
            "change",
            updatePreview
        );

    });


/* =========================================================
   GET PRINT MODE
========================================================= */

function getPrintMode() {

    const selected =
        document.querySelector(
            'input[name="printMode"]:checked'
        );


    if (!selected) {
        return "color";
    }


    return selected.value;
}


/* =========================================================
   GRID
========================================================= */

function getGrid(perPage) {

    const grids = {

        1: {
            columns: 1,
            rows: 1
        },

        2: {
            columns: 1,
            rows: 2
        },

        4: {
            columns: 2,
            rows: 2
        },

        6: {
            columns: 2,
            rows: 3
        },

        8: {
            columns: 2,
            rows: 4
        },

        9: {
            columns: 3,
            rows: 3
        },

        12: {
            columns: 3,
            rows: 4
        }

    };


    return grids[perPage] || grids[1];
}


/* =========================================================
   VISUAL PRINT PREVIEW
========================================================= */

function updatePreview() {

    previewContainer.innerHTML = "";


    if (
        slides.length === 0 ||
        selectedSlideIds.size === 0
    ) {

        previewContainer.innerHTML =
            '<div class="empty-message">Print preview will appear here.</div>';

        return;
    }


    const selected =
        slides.filter(slide =>
            selectedSlideIds.has(
                slide.id
            )
        );


    const perPage =
        Number(
            slidesPerPage.value
        );


    const grid =
        getGrid(perPage);


    const mode =
        getPrintMode();


    const marginMM =
        Number(margin.value);


    const spacingMM =
        Number(spacing.value);


    const borderEnabled =
        border.checked;


    const pageCount =
        Math.ceil(
            selected.length / perPage
        );


    /*
     * Create preview pages.
     */

    for (
        let pageIndex = 0;
        pageIndex < pageCount;
        pageIndex++
    ) {

        const paper =
            document.createElement("div");

        paper.className =
            "preview-paper";


        paper.dataset.paper =
            paperSize.value.toLowerCase();


        paper.dataset.orientation =
            orientation.value;


        const gridElement =
            document.createElement("div");

        gridElement.className =
            "preview-grid";


        gridElement.style.gridTemplateColumns =
            `repeat(${grid.columns}, 1fr)`;


        gridElement.style.gridTemplateRows =
            `repeat(${grid.rows}, 1fr)`;


        /*
         * Use proportional values for
         * margin and spacing.
         */

        const marginPercent =
            Math.min(
                12,
                Math.max(
                    1,
                    marginMM * 0.55
                )
            );


        const spacingPercent =
            Math.min(
                8,
                Math.max(
                    0,
                    spacingMM * 0.45
                )
            );


        gridElement.style.padding =
            marginPercent + "%";


        gridElement.style.gap =
            spacingPercent + "%";


        const start =
            pageIndex * perPage;


        const end =
            Math.min(
                start + perPage,
                selected.length
            );


        for (
            let i = start;
            i < end;
            i++
        ) {

            const slide =
                selected[i];


            const item =
                document.createElement("div");


            item.className =
                "preview-slide";


            if (borderEnabled) {

                item.classList.add(
                    "preview-border"
                );
            }


            const canvas =
                document.createElement("canvas");


            canvas.width =
                slide.canvas.width;

            canvas.height =
                slide.canvas.height;


            const context =
                canvas.getContext("2d");


            context.fillStyle =
                "#ffffff";


            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );


            if (mode === "bw") {

                /*
                 * Real grayscale pixels
                 * for preview.
                 */

                const source =
                    slide.canvas;


                context.drawImage(
                    source,
                    0,
                    0
                );


                const imageData =
                    context.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );


                convertImageDataToGrayscale(
                    imageData
                );


                context.putImageData(
                    imageData,
                    0,
                    0
                );

            } else {

                context.drawImage(
                    slide.canvas,
                    0,
                    0
                );
            }


            item.appendChild(canvas);

            gridElement.appendChild(item);
        }


        paper.appendChild(
            gridElement
        );


        previewContainer.appendChild(
            paper
        );
    }
}


/* =========================================================
   GRAYSCALE
========================================================= */

function convertImageDataToGrayscale(
    imageData
) {

    const data =
        imageData.data;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const gray =
            Math.round(
                0.299 * data[i] +
                0.587 * data[i + 1] +
                0.114 * data[i + 2]
            );


        data[i] =
            gray;

        data[i + 1] =
            gray;

        data[i + 2] =
            gray;
    }
}


/* =========================================================
   GENERATE PRINTABLE PDF
========================================================= */

generateBtn.addEventListener(
    "click",
    generatePrintablePDF
);


async function generatePrintablePDF() {

    if (
        slides.length === 0 ||
        selectedSlideIds.size === 0
    ) {

        alert(
            "Please upload a PDF and select at least one slide."
        );

        return;
    }


    generateBtn.disabled = true;


    statusMessage.textContent =
        "⏳ Creating printable PDF...";


    try {

        const jsPDF =
            window.jspdf.jsPDF;


        const selected =
            slides.filter(slide =>
                selectedSlideIds.has(
                    slide.id
                )
            );


        const perPage =
            Number(
                slidesPerPage.value
            );


        const format =
            paperSize.value === "LETTER"
                ? "letter"
                : paperSize.value.toLowerCase();


        const pdf =
            new jsPDF({

                orientation:
                    orientation.value,

                unit:
                    "mm",

                format:
                    format,

                compress:
                    true
            });


        const pageWidth =
            pdf.internal.pageSize.getWidth();


        const pageHeight =
            pdf.internal.pageSize.getHeight();


        const marginMM =
            Number(margin.value);


        const spacingMM =
            Number(spacing.value);


        const borderEnabled =
            border.checked;


        const mode =
            getPrintMode();


        const grid =
            getGrid(perPage);


        const columns =
            grid.columns;


        const rows =
            grid.rows;


        const usableWidth =
            pageWidth -
            (marginMM * 2);


        const usableHeight =
            pageHeight -
            (marginMM * 2);


        const cellWidth =
            (
                usableWidth -
                spacingMM * (columns - 1)
            ) / columns;


        const cellHeight =
            (
                usableHeight -
                spacingMM * (rows - 1)
            ) / rows;


        /*
         * Add slides.
         */

        for (
            let i = 0;
            i < selected.length;
            i++
        ) {

            const position =
                i % perPage;


            /*
             * New page.
             */

            if (
                i > 0 &&
                position === 0
            ) {

                pdf.addPage();
            }


            const row =
                Math.floor(
                    position / columns
                );


            const column =
                position % columns;


            const x =
                marginMM +
                column *
                (
                    cellWidth +
                    spacingMM
                );


            const y =
                marginMM +
                row *
                (
                    cellHeight +
                    spacingMM
                );


            await addSlideToPDF({

                pdf:
                    pdf,

                slide:
                    selected[i],

                x:
                    x,

                y:
                    y,

                width:
                    cellWidth,

                height:
                    cellHeight,

                borderEnabled:
                    borderEnabled,

                printMode:
                    mode
            });
        }


        /*
         * Save.
         */

        pdf.save(
            "Digital-To-Printable.pdf"
        );


        statusMessage.textContent =
            "✅ Printable PDF created successfully.";


    } catch (error) {

        console.error(error);

        statusMessage.textContent =
            "❌ PDF generation failed.";

        alert(
            "PDF generation failed. Please try again."
        );

    } finally {

        generateBtn.disabled = false;
    }
}


/* =========================================================
   ADD SLIDE TO PDF
========================================================= */

async function addSlideToPDF({

    pdf,
    slide,
    x,
    y,
    width,
    height,
    borderEnabled,
    printMode

}) {

    const source =
        slide.canvas;


    const canvas =
        document.createElement("canvas");


    canvas.width =
        source.width;

    canvas.height =
        source.height;


    const context =
        canvas.getContext("2d");


    /*
     * White background.
     */

    context.fillStyle =
        "#ffffff";


    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
     * Draw source.
     */

    context.drawImage(
        source,
        0,
        0
    );


    /*
     * Convert to grayscale
     * if B&W is selected.
     */

    if (printMode === "bw") {

        const imageData =
            context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );


        convertImageDataToGrayscale(
            imageData
        );


        context.putImageData(
            imageData,
            0,
            0
        );
    }


    const imageData =
        canvas.toDataURL(
            "image/jpeg",
            0.90
        );


    /*
     * Maintain aspect ratio.
     */

    const imageRatio =
        canvas.width /
        canvas.height;


    const boxRatio =
        width /
        height;


    let finalWidth =
        width;


    let finalHeight =
        height;


    if (
        imageRatio > boxRatio
    ) {

        finalHeight =
            width / imageRatio;

    } else {

        finalWidth =
            height * imageRatio;
    }


    const finalX =
        x +
        (
            width -
            finalWidth
        ) / 2;


    const finalY =
        y +
        (
            height -
            finalHeight
        ) / 2;


    /*
     * Add image.
     */

    pdf.addImage(

        imageData,

        "JPEG",

        finalX,

        finalY,

        finalWidth,

        finalHeight,

        undefined,

        "FAST"
    );


    /*
     * Border.
     */

    if (borderEnabled) {

        pdf.setDrawColor(
            100,
            100,
            100
        );


        pdf.setLineWidth(
            0.3
        );


        pdf.rect(
            x,
            y,
            width,
            height
        );
    }
}
