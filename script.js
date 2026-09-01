/* =========================================================
   DIGITAL TO PRINTABLE
   COMPLETE ADVANCED SCRIPT
   HIGH QUALITY + CUSTOM PAPER + PRINT PREVIEW
========================================================= */


/* =========================================================
   PDF.JS WORKER
========================================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let pdfDocument = null;

let slides = [];

let deletedHistory = [];

let selectedSlideIds = new Set();

let slideCounter = 0;


/*
 * High quality rendering scale.
 *
 * 2.0 gives good quality while keeping
 * mobile memory usage reasonable.
 */
const RENDER_SCALE = 2.0;


/* =========================================================
   GET ELEMENTS
========================================================= */

const fileInput =
    document.getElementById("pdfFile");

const fileName =
    document.getElementById("fileName");

const totalSlides =
    document.getElementById("totalSlides");

const selectedSlides =
    document.getElementById("selectedSlides");

const slidesPerPageInfo =
    document.getElementById("slidesPerPageInfo");

const paperSaving =
    document.getElementById("paperSaving");

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


/*
 * Custom paper fields.
 * These were added to index.html earlier.
 */

const customPaperSettings =
    document.getElementById(
        "customPaperSettings"
    );

const customWidth =
    document.getElementById(
        "customWidth"
    );

const customHeight =
    document.getElementById(
        "customHeight"
    );


/* =========================================================
   INITIALIZATION
========================================================= */

initialize();


function initialize() {

    if (marginValue && margin) {
        marginValue.textContent =
            margin.value;
    }

    if (spacingValue && spacing) {
        spacingValue.textContent =
            spacing.value;
    }

    updateCustomPaperVisibility();

    updateInformation();

    updateGenerateButton();

    updatePreview();
}


/* =========================================================
   PDF UPLOAD
========================================================= */

if (fileInput) {

    fileInput.addEventListener(
        "change",
        handlePDFUpload
    );
}


async function handlePDFUpload(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    /* -----------------------------------------
       PDF VALIDATION
    ----------------------------------------- */

    const isPDF =
        file.type === "application/pdf" ||
        file.name
            .toLowerCase()
            .endsWith(".pdf");


    if (!isPDF) {

        alert(
            "Please select a valid PDF file."
        );

        fileInput.value = "";

        return;
    }


    /* -----------------------------------------
       RESET OLD DATA
    ----------------------------------------- */

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


    previewContainer.innerHTML =
        '<div class="empty-message">Creating preview...</div>';


    generateBtn.disabled = true;


    try {

        /* -------------------------------------
           READ FILE
        ------------------------------------- */

        const arrayBuffer =
            await file.arrayBuffer();


        /* -------------------------------------
           LOAD PDF
        ------------------------------------- */

        const loadingTask =
            pdfjsLib.getDocument({

                data: arrayBuffer,

                /*
                 * Helps PDF.js release some
                 * resources after processing.
                 */
                isEvalSupported: true
            });


        pdfDocument =
            await loadingTask.promise;


        totalSlides.textContent =
            pdfDocument.numPages;


        statusMessage.textContent =
            "⏳ Rendering slides...";


        /* -------------------------------------
           RENDER
        ------------------------------------- */

        await renderAllSlides();


        /* -------------------------------------
           AUTO SELECT ALL
        ------------------------------------- */

        slides.forEach(
            slide => {

                selectedSlideIds.add(
                    slide.id
                );

            }
        );


        updateSlideVisuals();

        updateInformation();

        updateGenerateButton();

        updatePreview();


        statusMessage.textContent =
            "✅ PDF loaded successfully.";


    } catch (error) {

        console.error(
            "PDF LOAD ERROR:",
            error
        );


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

        statusMessage.textContent =
            "⏳ Rendering slide " +
            pageNumber +
            " / " +
            pdfDocument.numPages;


        await renderSlide(
            pageNumber
        );


        /*
         * Small yield prevents the browser
         * from freezing on large PDFs.
         */

        await new Promise(
            resolve =>
                setTimeout(resolve, 0)
        );
    }
}


/* =========================================================
   RENDER SINGLE SLIDE
========================================================= */

async function renderSlide(pageNumber) {

    const page =
        await pdfDocument.getPage(
            pageNumber
        );


    const viewport =
        page.getViewport({
            scale: RENDER_SCALE
        });


    const canvas =
        document.createElement(
            "canvas"
        );


    const context =
        canvas.getContext(
            "2d",
            {
                alpha: false
            }
        );


    canvas.width =
        Math.ceil(
            viewport.width
        );


    canvas.height =
        Math.ceil(
            viewport.height
        );


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
     * Render PDF page at high resolution.
     */

    await page.render({

        canvasContext:
            context,

        viewport:
            viewport,

        background:
            "white"

    }).promise;


    const slide = {

        id:
            ++slideCounter,

        pageNumber:
            pageNumber,

        canvas:
            canvas
    };


    slides.push(
        slide
    );


    createSlideCard(
        slide
    );
}


/* =========================================================
   CREATE SLIDE CARD
========================================================= */

function createSlideCard(slide) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "slide-card";


    card.dataset.id =
        slide.id;


    const check =
        document.createElement(
            "div"
        );


    check.className =
        "slide-check";


    check.textContent =
        "✓";


    const number =
        document.createElement(
            "div"
        );


    number.className =
        "slide-number";


    number.textContent =
        "Slide " +
        slide.pageNumber;


    /*
     * Do not move the original
     * high-resolution canvas.
     *
     * It is used later for PDF creation.
     */

    card.appendChild(
        check
    );


    card.appendChild(
        slide.canvas
    );


    card.appendChild(
        number
    );


    card.addEventListener(
        "click",
        function () {

            toggleSlide(
                slide.id
            );

        }
    );


    slidesContainer.appendChild(
        card
    );
}


/* =========================================================
   TOGGLE SLIDE
========================================================= */

function toggleSlide(id) {

    if (
        selectedSlideIds.has(id)
    ) {

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


    cards.forEach(
        card => {

            const id =
                Number(
                    card.dataset.id
                );


            if (
                selectedSlideIds.has(
                    id
                )
            ) {

                card.classList.add(
                    "selected"
                );

            } else {

                card.classList.remove(
                    "selected"
                );
            }

        }
    );
}


/* =========================================================
   SELECT ALL
========================================================= */

if (selectAllBtn) {

    selectAllBtn.addEventListener(
        "click",
        selectAllSlides
    );
}


function selectAllSlides() {

    selectedSlideIds.clear();


    slides.forEach(
        slide => {

            selectedSlideIds.add(
                slide.id
            );

        }
    );


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();

    updatePreview();


    statusMessage.textContent =
        "✅ All slides selected.";
}


/* =========================================================
   CLEAR ALL
========================================================= */

if (clearAllBtn) {

    clearAllBtn.addEventListener(
        "click",
        clearAllSlides
    );
}


function clearAllSlides() {

    selectedSlideIds.clear();


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();

    updatePreview();


    statusMessage.textContent =
        "⬜ All slides cleared.";
}


/* =========================================================
   DELETE SELECTED
========================================================= */

if (deleteBtn) {

    deleteBtn.addEventListener(
        "click",
        deleteSelectedSlides
    );
}


function deleteSelectedSlides() {

    if (
        selectedSlideIds.size === 0
    ) {

        alert(
            "Please select slides to delete."
        );

        return;
    }


    const deletedSlides =
        slides.filter(
            slide =>
                selectedSlideIds.has(
                    slide.id
                )
        );


    deletedHistory.push(
        deletedSlides
    );


    slides =
        slides.filter(
            slide =>
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
   UNDO DELETE
========================================================= */

if (undoBtn) {

    undoBtn.addEventListener(
        "click",
        undoDelete
    );
}


function undoDelete() {

    if (
        deletedHistory.length === 0
    ) {

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
            a.pageNumber -
            b.pageNumber
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

    if (!slidesPerPage) {
        return;
    }


    const perPage =
        Number(
            slidesPerPage.value
        );


    slidesPerPageInfo.textContent =
        perPage;


    selectedSlides.textContent =
        selectedSlideIds.size;


    if (slides.length === 0) {

        paperSaving.textContent =
            "0%";

        return;
    }


    /*
     * Use selected slides for actual
     * paper-saving calculation.
     */

    const selectedCount =
        selectedSlideIds.size;


    if (selectedCount === 0) {

        paperSaving.textContent =
            "0%";

        return;
    }


    const printablePages =
        Math.ceil(
            selectedCount /
            perPage
        );


    const saving =
        Math.max(
            0,
            Math.round(
                (
                    1 -
                    printablePages /
                    selectedCount
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

    if (!generateBtn) {
        return;
    }


    generateBtn.disabled =
        slides.length === 0 ||
        selectedSlideIds.size === 0;
}


/* =========================================================
   SETTINGS EVENTS
========================================================= */

if (slidesPerPage) {

    slidesPerPage.addEventListener(
        "change",
        function () {

            updateInformation();

            updatePreview();

        }
    );
}


if (margin) {

    margin.addEventListener(
        "input",
        function () {

            marginValue.textContent =
                margin.value;

            updatePreview();

        }
    );
}


if (spacing) {

    spacing.addEventListener(
        "input",
        function () {

            spacingValue.textContent =
                spacing.value;

            updatePreview();

        }
    );
}


if (paperSize) {

    paperSize.addEventListener(
        "change",
        function () {

            updateCustomPaperVisibility();

            updatePreview();

        }
    );
}


if (orientation) {

    orientation.addEventListener(
        "change",
        updatePreview
    );
}


if (border) {

    border.addEventListener(
        "change",
        updatePreview
    );
}


document
    .querySelectorAll(
        'input[name="printMode"]'
    )
    .forEach(
        input => {

            input.addEventListener(
                "change",
                updatePreview
            );

        }
    );


/* =========================================================
   CUSTOM PAPER VISIBILITY
========================================================= */

function updateCustomPaperVisibility() {

    if (
        !customPaperSettings ||
        !paperSize
    ) {
        return;
    }


    if (
        paperSize.value ===
        "CUSTOM"
    ) {

        customPaperSettings.style.display =
            "block";

    } else {

        customPaperSettings.style.display =
            "none";
    }
}


/* =========================================================
   CUSTOM PAPER EVENTS
========================================================= */

if (customWidth) {

    customWidth.addEventListener(
        "input",
        updatePreview
    );
}


if (customHeight) {

    customHeight.addEventListener(
        "input",
        updatePreview
    );
}


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
   GRID LAYOUT
========================================================= */

function getGrid(perPage) {

    /*
     * 12 = 2 columns × 6 rows
     * exactly as requested.
     */

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
            columns: 2,
            rows: 6
        }

    };


    return (
        grids[perPage] ||
        grids[1]
    );
}


/* =========================================================
   GET PAPER SIZE
========================================================= */

function getPaperSizeMM() {

    let width;
    let height;


    switch (
        paperSize.value
    ) {

        case "A4":

            width = 210;
            height = 297;

            break;


        case "A5":

            width = 148;
            height = 210;

            break;


        case "LETTER":

            width = 215.9;
            height = 279.4;

            break;


        case "CUSTOM":

            width =
                Number(
                    customWidth.value
                );


            height =
                Number(
                    customHeight.value
                );


            if (
                !Number.isFinite(width) ||
                width < 50
            ) {

                width = 210;
            }


            if (
                !Number.isFinite(height) ||
                height < 50
            ) {

                height = 297;
            }


            break;


        default:

            width = 210;
            height = 297;
    }


    /*
     * Landscape swaps width and height.
     */

    if (
        orientation.value ===
        "landscape"
    ) {

        return {

            width:
                height,

            height:
                width

        };

    }


    return {

        width:
            width,

        height:
            height

    };
}


/* =========================================================
   PREVIEW PAPER CSS SIZE
========================================================= */

function getPreviewAspectRatio() {

    const paper =
        getPaperSizeMM();


    return (
        paper.width +
        " / " +
        paper.height
    );
}


/* =========================================================
   VISUAL PRINT PREVIEW
========================================================= */

function updatePreview() {

    if (!previewContainer) {
        return;
    }


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
        slides.filter(
            slide =>
                selectedSlideIds.has(
                    slide.id
                )
        );


    const perPage =
        Number(
            slidesPerPage.value
        );


    const grid =
        getGrid(
            perPage
        );


    const mode =
        getPrintMode();


    const marginMM =
        Number(
            margin.value
        );


    const spacingMM =
        Number(
            spacing.value
        );


    const borderEnabled =
        border.checked;


    const pageCount =
        Math.ceil(
            selected.length /
            perPage
        );


    /*
     * Create every printable page.
     */

    for (
        let pageIndex = 0;
        pageIndex < pageCount;
        pageIndex++
    ) {

        const paper =
            document.createElement(
                "div"
            );


        paper.className =
            "preview-paper";


        /*
         * Exact paper ratio.
         */

        paper.style.aspectRatio =
            getPreviewAspectRatio();


        /*
         * Grid.
         */

        const gridElement =
            document.createElement(
                "div"
            );


        gridElement.className =
            "preview-grid";


        gridElement.style.gridTemplateColumns =
            `repeat(${grid.columns}, 1fr)`;


        gridElement.style.gridTemplateRows =
            `repeat(${grid.rows}, 1fr)`;


        /*
         * Convert mm values into
         * reasonable preview percentages.
         */

        const marginPercent =
            Math.min(
                7,
                Math.max(
                    0.3,
                    marginMM * 0.30
                )
            );


        const spacingPercent =
            Math.min(
                3,
                Math.max(
                    0,
                    spacingMM * 0.25
                )
            );


        gridElement.style.padding =
            marginPercent +
            "%";


        gridElement.style.gap =
            spacingPercent +
            "%";


        const start =
            pageIndex *
            perPage;


        const end =
            Math.min(
                start + perPage,
                selected.length
            );


        /*
         * Add slides to this page.
         */

        for (
            let i = start;
            i < end;
            i++
        ) {

            const slide =
                selected[i];


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "preview-slide";


            if (
                borderEnabled
            ) {

                item.classList.add(
                    "preview-border"
                );
            }


            const canvas =
                document.createElement(
                    "canvas"
                );


            canvas.width =
                slide.canvas.width;


            canvas.height =
                slide.canvas.height;


            const context =
                canvas.getContext(
                    "2d",
                    {
                        alpha: false
                    }
                );


            context.fillStyle =
                "#ffffff";


            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );


            context.drawImage(
                slide.canvas,
                0,
                0
            );


            /*
             * B&W preview.
             */

            if (
                mode === "bw"
            ) {

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


            item.appendChild(
                canvas
            );


            gridElement.appendChild(
                item
            );
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
   GENERATE BUTTON
========================================================= */

if (generateBtn) {

    generateBtn.addEventListener(
        "click",
        generatePrintablePDF
    );
}


/* =========================================================
   GENERATE PRINTABLE PDF
========================================================= */

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


    /*
     * Check jsPDF.
     */

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "PDF engine is not available. Please refresh the page."
        );

        return;
    }


    generateBtn.disabled =
        true;


    statusMessage.textContent =
        "⏳ Preparing printable PDF...";


    try {

        const jsPDF =
            window.jspdf.jsPDF;


        const selected =
            slides.filter(
                slide =>
                    selectedSlideIds.has(
                        slide.id
                    )
            );


        const perPage =
            Number(
                slidesPerPage.value
            );


        const paper =
            getPaperSizeMM();


        /*
         * jsPDF custom page format.
         *
         * This also makes Custom paper
         * work correctly.
         */

        const pdf =
            new jsPDF({

                orientation:
                    "portrait",

                unit:
                    "mm",

                format:
                    [
                        paper.width,
                        paper.height
                    ],

                compress:
                    true
            });


        const pageWidth =
            paper.width;


        const pageHeight =
            paper.height;


        const marginMM =
            Number(
                margin.value
            );


        const spacingMM =
            Number(
                spacing.value
            );


        const borderEnabled =
            border.checked;


        const mode =
            getPrintMode();


        const grid =
            getGrid(
                perPage
            );


        const columns =
            grid.columns;


        const rows =
            grid.rows;


        /*
         * Safety checks.
         */

        const safeMargin =
            Math.max(
                0,
                marginMM
            );


        const safeSpacing =
            Math.max(
                0,
                spacingMM
            );


        /*
         * Available page area.
         */

        const usableWidth =
            pageWidth -
            (
                safeMargin * 2
            );


        const usableHeight =
            pageHeight -
            (
                safeMargin * 2
            );


        /*
         * Size of each slide cell.
         */

        const cellWidth =
            (
                usableWidth -
                (
                    safeSpacing *
                    (columns - 1)
                )
            ) /
            columns;


        const cellHeight =
            (
                usableHeight -
                (
                    safeSpacing *
                    (rows - 1)
                )
            ) /
            rows;


        /*
         * Make sure values are valid.
         */

        if (
            cellWidth <= 0 ||
            cellHeight <= 0
        ) {

            throw new Error(
                "Margin or spacing is too large for this paper size."
            );
        }


        /*
         * Process slides.
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

                pdf.addPage(
                    [
                        pageWidth,
                        pageHeight
                    ]
                );
            }


            const row =
                Math.floor(
                    position /
                    columns
                );


            const column =
                position %
                columns;


            const x =
                safeMargin +
                column *
                (
                    cellWidth +
                    safeSpacing
                );


            const y =
                safeMargin +
                row *
                (
                    cellHeight +
                    safeSpacing
                );


            statusMessage.textContent =
                "⏳ Creating page " +
                (
                    Math.floor(
                        i / perPage
                    ) + 1
                ) +
                " / " +
                Math.ceil(
                    selected.length /
                    perPage
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


            /*
             * Allow browser to breathe.
             */

            if (
                i % 2 === 0
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            0
                        )
                );
            }
        }


        /*
         * Generate filename.
         */

        const originalName =
            fileName.textContent
                .replace("📄 ", "")
                .replace(".pdf", "")
                .trim();


        const safeName =
            originalName
                ? originalName +
                  "_printable.pdf"
                : "Digital-To-Printable.pdf";


        /*
         * Save.
         */

        pdf.save(
            safeName
        );


        statusMessage.textContent =
            "✅ Printable PDF created successfully.";


    } catch (error) {

        console.error(
            "PDF GENERATION ERROR:",
            error
        );


        statusMessage.textContent =
            "❌ PDF generation failed.";


        alert(
            "PDF generation failed.\n\n" +
            error.message
        );


    } finally {

        generateBtn.disabled =
            false;
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


    /*
     * Use the original high-resolution
     * canvas.
     */

    const sourceWidth =
        source.width;


    const sourceHeight =
        source.height;


    /*
     * Create processing canvas.
     */

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        sourceWidth;


    canvas.height =
        sourceHeight;


    const context =
        canvas.getContext(
            "2d",
            {
                alpha: false
            }
        );


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
     * Draw original high-resolution
     * slide.
     */

    context.drawImage(
        source,
        0,
        0
    );


    /*
     * B&W conversion.
     */

    if (
        printMode === "bw"
    ) {

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


    /*
     * PNG is lossless.
     *
     * This avoids JPEG compression artifacts
     * around text and diagrams.
     */

    const imageData =
        canvas.toDataURL(
            "image/png"
        );


    /*
     * Original slide aspect ratio.
     */

    const imageRatio =
        sourceWidth /
        sourceHeight;


    /*
     * Available cell ratio.
     */

    const boxRatio =
        width /
        height;


    let finalWidth =
        width;


    let finalHeight =
        height;


    /*
     * FIT mode:
     * keep complete slide visible.
     */

    if (
        imageRatio > boxRatio
    ) {

        finalWidth =
            width;


        finalHeight =
            width /
            imageRatio;

    } else {

        finalHeight =
            height;


        finalWidth =
            height *
            imageRatio;
    }


    /*
     * Center slide inside cell.
     */

    const finalX =
        x +
        (
            width -
            finalWidth
        ) /
        2;


    const finalY =
        y +
        (
            height -
            finalHeight
        ) /
        2;


    /*
     * Add lossless image.
     */

    pdf.addImage(

        imageData,

        "PNG",

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

    if (
        borderEnabled
    ) {

        pdf.setDrawColor(
            110,
            110,
            110
        );


        pdf.setLineWidth(
            0.25
        );


        pdf.rect(
            x,
            y,
            width,
            height
        );
    }
}


/* =========================================================
   END
========================================================= */
