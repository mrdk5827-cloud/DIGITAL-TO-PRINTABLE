/* =========================================================
   DIGITAL TO PRINTABLE
   MEMORY-SAFE + WHITE BACKGROUND VERSION
   ========================================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/* =========================================================
   MEMORY SETTINGS
========================================================= */

const THUMB_SCALE = 0.45;

const MAX_THUMB_WIDTH = 500;

const PRINT_SCALE = 2;

const MAX_PRINT_SCALE = 3;


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let pdfDocument = null;

let currentFile = null;

let slides = [];

let deletedHistory = [];

let selectedSlideIds = new Set();

let slideCounter = 0;

let isLoadingPDF = false;

let isGenerating = false;


/* =========================================================
   ELEMENTS
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

const customPaperSettings =
    document.getElementById("customPaperSettings");

const customWidth =
    document.getElementById("customWidth");

const customHeight =
    document.getElementById("customHeight");


/* =========================================================
   INITIAL SETUP
========================================================= */

if (margin && marginValue) {

    marginValue.textContent =
        margin.value;
}


if (spacing && spacingValue) {

    spacingValue.textContent =
        spacing.value;
}


updateCustomPaperVisibility();

updateInformation();

updateGenerateButton();


/* =========================================================
   PDF FILE SELECTION
========================================================= */

if (fileInput) {

    fileInput.addEventListener(
        "change",
        handlePDFSelection,
        false
    );
}


async function handlePDFSelection(event) {

    if (
        isLoadingPDF ||
        isGenerating
    ) {

        return;
    }


    const input =
        event.target;


    if (
        !input.files ||
        input.files.length === 0
    ) {

        return;
    }


    const file =
        input.files[0];


    /* ---------------------------------------------
       Validate PDF
    --------------------------------------------- */

    const isPDF =
        file.type === "application/pdf" ||
        file.name
            .toLowerCase()
            .endsWith(".pdf");


    if (!isPDF) {

        alert(
            "Please select a valid PDF file."
        );

        input.value = "";

        return;
    }


    /* ---------------------------------------------
       Start loading
    --------------------------------------------- */

    isLoadingPDF = true;

    if (generateBtn) {
        generateBtn.disabled = true;
    }


    fileName.textContent =
        "📄 " + file.name;


    statusMessage.textContent =
        "⏳ Reading PDF...";


    slidesContainer.innerHTML =
        '<div class="empty-message">Loading PDF...</div>';


    previewContainer.innerHTML =
        '<div class="empty-message">Preparing preview...</div>';


    try {

        /* -----------------------------------------
           Destroy previous PDF
        ----------------------------------------- */

        await destroyCurrentPDF();


        /* -----------------------------------------
           Clear old data
        ----------------------------------------- */

        slides = [];

        deletedHistory = [];

        selectedSlideIds.clear();

        slideCounter = 0;


        currentFile =
            file;


        /* -----------------------------------------
           Create temporary object URL
        ----------------------------------------- */

        const pdfURL =
            URL.createObjectURL(file);


        try {

            const loadingTask =
                pdfjsLib.getDocument({

                    url:
                        pdfURL

                });


            pdfDocument =
                await loadingTask.promise;


        } finally {

            /*
             * Release object URL as soon as
             * PDF.js has loaded the document.
             */

            URL.revokeObjectURL(
                pdfURL
            );
        }


        totalSlides.textContent =
            pdfDocument.numPages;


        /* -----------------------------------------
           Create thumbnails
        ----------------------------------------- */

        await createAllThumbnails();


        /* -----------------------------------------
           Select all slides
        ----------------------------------------- */

        for (
            const slide of slides
        ) {

            selectedSlideIds.add(
                slide.id
            );
        }


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


        slides = [];

        selectedSlideIds.clear();


        slidesContainer.innerHTML =
            '<div class="empty-message">PDF could not be loaded.</div>';


        previewContainer.innerHTML =
            '<div class="empty-message">No preview available.</div>';


        totalSlides.textContent =
            "0";


        selectedSlides.textContent =
            "0";


        paperSaving.textContent =
            "0%";


        statusMessage.textContent =
            "❌ PDF loading failed.";


        alert(
            "PDF load failed.\n\n" +
            (
                error.message ||
                "Unknown error"
            )
        );


    } finally {

        isLoadingPDF = false;

        updateGenerateButton();
    }
}


/* =========================================================
   CREATE ALL THUMBNAILS
========================================================= */

async function createAllThumbnails() {

    slidesContainer.innerHTML =
        "";


    const total =
        pdfDocument.numPages;


    for (
        let pageNumber = 1;
        pageNumber <= total;
        pageNumber++
    ) {

        statusMessage.textContent =
            "⏳ Loading slide " +
            pageNumber +
            " / " +
            total;


        try {

            const slide =
                await createThumbnail(
                    pageNumber
                );


            slides.push(
                slide
            );


            createSlideCard(
                slide
            );


        } catch (error) {

            console.warn(
                "Thumbnail error:",
                pageNumber,
                error
            );
        }


        /*
         * Give the mobile browser
         * some breathing time.
         */

        if (
            pageNumber % 2 === 0
        ) {

            await sleep(25);
        }
    }


    if (
        slides.length === 0
    ) {

        throw new Error(
            "No pages could be rendered."
        );
    }
}


/* =========================================================
   CREATE SINGLE THUMBNAIL
========================================================= */

async function createThumbnail(
    pageNumber
) {

    const page =
        await pdfDocument.getPage(
            pageNumber
        );


    const originalViewport =
        page.getViewport({
            scale: 1
        });


    let scale =
        THUMB_SCALE;


    const estimatedWidth =
        originalViewport.width *
        scale;


    if (
        estimatedWidth >
        MAX_THUMB_WIDTH
    ) {

        scale =
            MAX_THUMB_WIDTH /
            originalViewport.width;
    }


    const viewport =
        page.getViewport({
            scale:
                scale
        });


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        Math.max(
            1,
            Math.ceil(
                viewport.width
            )
        );


    canvas.height =
        Math.max(
            1,
            Math.ceil(
                viewport.height
            )
        );


    const context =
        canvas.getContext(
            "2d",
            {
                alpha:
                    false
            }
        );


    /*
     * White base
     */

    context.fillStyle =
        "#ffffff";


    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    await page.render({

        canvasContext:
            context,

        viewport:
            viewport,

        background:
            "white"

    }).promise;


    /*
     * IMPORTANT:
     *
     * Do NOT use getImageData() here.
     *
     * CSS filter uses almost no extra
     * JavaScript pixel memory.
     *
     * The original canvas remains untouched.
     */

    canvas.style.filter =
        "invert(1)";


    page.cleanup();


    const slide = {

        id:
            ++slideCounter,

        pageNumber:
            pageNumber,

        thumbnail:
            canvas
    };


    return slide;
}


/* =========================================================
   CREATE SLIDE CARD
========================================================= */

function createSlideCard(
    slide
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "slide-card";


    card.dataset.id =
        String(
            slide.id
        );


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


    card.appendChild(
        check
    );


    card.appendChild(
        slide.thumbnail
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

function toggleSlide(
    id
) {

    if (
        selectedSlideIds.has(id)
    ) {

        selectedSlideIds.delete(
            id
        );

    } else {

        selectedSlideIds.add(
            id
        );
    }


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();

    updatePreview();
}


/* =========================================================
   SELECT ALL
========================================================= */

if (selectAllBtn) {

    selectAllBtn.addEventListener(
        "click",
        function () {

            selectedSlideIds.clear();


            slides.forEach(
                function (slide) {

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
    );
}


/* =========================================================
   CLEAR ALL
========================================================= */

if (clearAllBtn) {

    clearAllBtn.addEventListener(
        "click",
        function () {

            selectedSlideIds.clear();


            updateSlideVisuals();

            updateInformation();

            updateGenerateButton();

            updatePreview();


            statusMessage.textContent =
                "⬜ All slides cleared.";
        }
    );
}


/* =========================================================
   DELETE SELECTED
========================================================= */

if (deleteBtn) {

    deleteBtn.addEventListener(
        "click",
        function () {

            if (
                selectedSlideIds.size === 0
            ) {

                alert(
                    "Please select slides to delete."
                );

                return;
            }


            const deleted =
                slides.filter(
                    function (slide) {

                        return selectedSlideIds.has(
                            slide.id
                        );
                    }
                );


            deletedHistory.push(
                deleted
            );


            slides =
                slides.filter(
                    function (slide) {

                        return !selectedSlideIds.has(
                            slide.id
                        );
                    }
                );


            selectedSlideIds.clear();


            redrawSlides();

            updateInformation();

            updateGenerateButton();

            updatePreview();


            statusMessage.textContent =
                "🗑️ Selected slides deleted.";
        }
    );
}


/* =========================================================
   UNDO DELETE
========================================================= */

if (undoBtn) {

    undoBtn.addEventListener(
        "click",
        function () {

            if (
                deletedHistory.length === 0
            ) {

                alert(
                    "Nothing to undo."
                );

                return;
            }


            const deleted =
                deletedHistory.pop();


            slides.push(
                ...deleted
            );


            slides.sort(
                function (a, b) {

                    return (
                        a.pageNumber -
                        b.pageNumber
                    );
                }
            );


            redrawSlides();

            updateInformation();

            updateGenerateButton();

            updatePreview();


            statusMessage.textContent =
                "↩️ Delete undone.";
        }
    );
}


/* =========================================================
   REDRAW SLIDES
========================================================= */

function redrawSlides() {

    slidesContainer.innerHTML =
        "";


    if (
        slides.length === 0
    ) {

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
   UPDATE VISUAL SELECTION
========================================================= */

function updateSlideVisuals() {

    const cards =
        document.querySelectorAll(
            ".slide-card"
        );


    cards.forEach(
        function (card) {

            const id =
                Number(
                    card.dataset.id
                );


            if (
                selectedSlideIds.has(id)
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
   INFORMATION
========================================================= */

function updateInformation() {

    const perPage =
        Number(
            slidesPerPage.value
        ) || 12;


    slidesPerPageInfo.textContent =
        String(
            perPage
        );


    selectedSlides.textContent =
        String(
            selectedSlideIds.size
        );


    if (
        selectedSlideIds.size === 0
    ) {

        paperSaving.textContent =
            "0%";

        return;
    }


    const printablePages =
        Math.ceil(
            selectedSlideIds.size /
            perPage
        );


    const saving =
        Math.max(
            0,
            Math.round(
                (
                    1 -
                    printablePages /
                    selectedSlideIds.size
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
        isLoadingPDF ||
        isGenerating ||
        !pdfDocument ||
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


document
    .querySelectorAll(
        'input[name="printMode"]'
    )
    .forEach(
        function (input) {

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
   GET PAPER SIZE
========================================================= */

function getPaperSizeMM() {

    let width = 210;

    let height = 297;


    switch (
        paperSize.value
    ) {

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
                ) || 210;

            height =
                Number(
                    customHeight.value
                ) || 297;

            break;


        case "A4":

        default:

            width = 210;

            height = 297;

            break;
    }


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
   GRID
========================================================= */

function getGrid(
    perPage
) {

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
        grids[12]
    );
}


/* =========================================================
   UPDATE PREVIEW
========================================================= */

function updatePreview() {

    if (!previewContainer) {
        return;
    }


    previewContainer.innerHTML =
        "";


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
            function (slide) {

                return selectedSlideIds.has(
                    slide.id
                );
            }
        );


    const perPage =
        Number(
            slidesPerPage.value
        );


    const grid =
        getGrid(
            perPage
        );


    const paper =
        getPaperSizeMM();


    const marginMM =
        Number(
            margin.value
        ) || 0;


    const spacingMM =
        Number(
            spacing.value
        ) || 0;


    const pageCount =
        Math.ceil(
            selected.length /
            perPage
        );


    for (
        let pageIndex = 0;
        pageIndex < pageCount;
        pageIndex++
    ) {

        const paperElement =
            document.createElement(
                "div"
            );


        paperElement.className =
            "preview-paper";


        paperElement.style.aspectRatio =
            paper.width +
            " / " +
            paper.height;


        const gridElement =
            document.createElement(
                "div"
            );


        gridElement.className =
            "preview-grid";


        gridElement.style.gridTemplateColumns =
            "repeat(" +
            grid.columns +
            ", 1fr)";


        gridElement.style.gridTemplateRows =
            "repeat(" +
            grid.rows +
            ", 1fr)";


        gridElement.style.padding =
            (
                marginMM /
                Math.max(
                    paper.width,
                    paper.height
                ) *
                100
            ) + "%";


        gridElement.style.gap =
            (
                spacingMM /
                Math.max(
                    paper.width,
                    paper.height
                ) *
                100
            ) + "%";


        const start =
            pageIndex *
            perPage;


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

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "preview-slide";


            if (
                border.checked
            ) {

                item.classList.add(
                    "preview-border"
                );
            }


            const canvas =
                document.createElement(
                    "canvas"
                );


            const thumbnail =
                selected[i].thumbnail;


            canvas.width =
                thumbnail.width;


            canvas.height =
                thumbnail.height;


            const context =
                canvas.getContext(
                    "2d"
                );


            /*
             * Invert while copying thumbnail.
             *
             * This avoids creating another
             * permanent inverted thumbnail.
             */

            try {

                context.filter =
                    "invert(1)";

            } catch (error) {

                /*
                 * Fallback for browsers that
                 * do not support canvas filter.
                 */

                context.filter =
                    "none";
            }


            context.drawImage(
                thumbnail,
                0,
                0
            );


            context.filter =
                "none";


            item.appendChild(
                canvas
            );


            gridElement.appendChild(
                item
            );
        }


        paperElement.appendChild(
            gridElement
        );


        previewContainer.appendChild(
            paperElement
        );
    }
}


/* =========================================================
   GENERATE PRINTABLE PDF
========================================================= */

if (generateBtn) {

    generateBtn.addEventListener(
        "click",
        generatePrintablePDF
    );
}


async function generatePrintablePDF() {

    if (
        isGenerating ||
        !pdfDocument ||
        selectedSlideIds.size === 0
    ) {

        return;
    }


    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {

        alert(
            "PDF engine is not available."
        );

        return;
    }


    isGenerating = true;

    generateBtn.disabled =
        true;


    statusMessage.textContent =
        "⏳ Creating printable PDF...";


    try {

        const jsPDF =
            window.jspdf.jsPDF;


        const selected =
            slides.filter(
                function (slide) {

                    return selectedSlideIds.has(
                        slide.id
                    );
                }
            );


        const perPage =
            Number(
                slidesPerPage.value
            );


        const grid =
            getGrid(
                perPage
            );


        const paper =
            getPaperSizeMM();


        const marginMM =
            Number(
                margin.value
            ) || 0;


        const spacingMM =
            Number(
                spacing.value
            ) || 0;


        if (
            marginMM * 2 >= paper.width ||
            marginMM * 2 >= paper.height
        ) {

            throw new Error(
                "Margin is too large."
            );
        }


        const printableWidth =
            paper.width -
            marginMM * 2;


        const printableHeight =
            paper.height -
            marginMM * 2;


        const cellWidth =
            (
                printableWidth -
                spacingMM *
                (
                    grid.columns - 1
                )
            ) /
            grid.columns;


        const cellHeight =
            (
                printableHeight -
                spacingMM *
                (
                    grid.rows - 1
                )
            ) /
            grid.rows;


        if (
            cellWidth <= 0 ||
            cellHeight <= 0
        ) {

            throw new Error(
                "Margin or spacing is too large."
            );
        }


        const pdf =
            new jsPDF({

                orientation:
                    paper.width >
                    paper.height
                        ? "landscape"
                        : "portrait",

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


        for (
            let i = 0;
            i < selected.length;
            i++
        ) {

            const position =
                i % perPage;


            /*
             * New printable page
             */

            if (
                i > 0 &&
                position === 0
            ) {

                pdf.addPage(
                    [
                        paper.width,
                        paper.height
                    ]
                );
            }


            const row =
                Math.floor(
                    position /
                    grid.columns
                );


            const column =
                position %
                grid.columns;


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


            statusMessage.textContent =
                "⏳ Rendering slide " +
                (i + 1) +
                " / " +
                selected.length;


            await renderSlideToPDF(
                pdf,
                selected[i].pageNumber,
                x,
                y,
                cellWidth,
                cellHeight
            );


            /*
             * Give mobile browser
             * some breathing time.
             */

            await sleep(15);
        }


        const originalName =
            currentFile
                ? currentFile.name
                : "Digital-To-Printable.pdf";


        const cleanName =
            originalName.replace(
                /\.pdf$/i,
                ""
            );


        pdf.save(
            cleanName +
            "_printable.pdf"
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
            (
                error.message ||
                "Unknown error"
            )
        );


    } finally {

        isGenerating = false;

        updateGenerateButton();
    }
}


/* =========================================================
   RENDER ONE HIGH QUALITY SLIDE
========================================================= */

async function renderSlideToPDF(
    pdf,
    pageNumber,
    x,
    y,
    boxWidth,
    boxHeight
) {

    const page =
        await pdfDocument.getPage(
            pageNumber
        );


    const originalViewport =
        page.getViewport({
            scale: 1
        });


    /*
     * Calculate suitable quality.
     *
     * Keep mobile memory under control.
     */

    const targetWidth =
        Math.min(
            1400,
            Math.max(
                650,
                Math.round(
                    boxWidth * 7
                )
            )
        );


    let scale =
        targetWidth /
        originalViewport.width;


    scale =
        Math.max(
            PRINT_SCALE,
            scale
        );


    scale =
        Math.min(
            scale,
            MAX_PRINT_SCALE
        );


    const viewport =
        page.getViewport({
            scale:
                scale
        });


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        Math.ceil(
            viewport.width
        );


    canvas.height =
        Math.ceil(
            viewport.height
        );


    const context =
        canvas.getContext(
            "2d",
            {
                alpha:
                    false
            }
        );


    /*
     * White base
     */

    context.fillStyle =
        "#ffffff";


    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    await page.render({

        canvasContext:
            context,

        viewport:
            viewport,

        background:
            "white"

    }).promise;


    /*
     * =====================================================
     * MAIN CONVERSION
     *
     * BLACK  → WHITE
     * WHITE  → BLACK
     *
     * Done in small chunks so the complete
     * pixel array is never held in memory.
     * =====================================================
     */

    await invertCanvasMemorySafe(
        context,
        canvas.width,
        canvas.height
    );


    /*
     * Existing B&W option still works.
     */

    const mode =
        document.querySelector(
            'input[name="printMode"]:checked'
        );


    if (
        mode &&
        mode.value === "bw"
    ) {

        const imageData =
            context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );


        convertToGrayscale(
            imageData
        );


        context.putImageData(
            imageData,
            0,
            0
        );
    }


    /*
     * Keep original slide ratio.
     */

    const imageRatio =
        canvas.width /
        canvas.height;


    const boxRatio =
        boxWidth /
        boxHeight;


    let imageWidth;

    let imageHeight;


    if (
        imageRatio >
        boxRatio
    ) {

        imageWidth =
            boxWidth;

        imageHeight =
            boxWidth /
            imageRatio;

    } else {

        imageHeight =
            boxHeight;

        imageWidth =
            boxHeight *
            imageRatio;
    }


    const imageX =
        x +
        (
            boxWidth -
            imageWidth
        ) / 2;


    const imageY =
        y +
        (
            boxHeight -
            imageHeight
        ) / 2;


    /*
     * PNG keeps text and diagrams sharp.
     */

    const imageDataURL =
        canvas.toDataURL(
            "image/png"
        );


    pdf.addImage(

        imageDataURL,

        "PNG",

        imageX,

        imageY,

        imageWidth,

        imageHeight,

        undefined,

        "FAST"
    );


    /*
     * Border
     */

    if (
        border.checked
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
            boxWidth,
            boxHeight
        );
    }


    /*
     * IMPORTANT:
     * Release canvas memory.
     */

    canvas.width = 1;

    canvas.height = 1;


    page.cleanup();


    await sleep(0);
}


/* =========================================================
   MEMORY-SAFE COLOR INVERSION
========================================================= */

async function invertCanvasMemorySafe(
    context,
    width,
    height
) {

    /*
     * Small chunks are safer on mobile.
     */

    const CHUNK_HEIGHT = 64;


    for (
        let y = 0;
        y < height;
        y += CHUNK_HEIGHT
    ) {

        const chunkHeight =
            Math.min(
                CHUNK_HEIGHT,
                height - y
            );


        const imageData =
            context.getImageData(
                0,
                y,
                width,
                chunkHeight
            );


        const data =
            imageData.data;


        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            data[i] =
                255 -
                data[i];


            data[i + 1] =
                255 -
                data[i + 1];


            data[i + 2] =
                255 -
                data[i + 2];

            /*
             * Alpha remains unchanged.
             */
        }


        context.putImageData(
            imageData,
            0,
            y
        );


        /*
         * Give mobile browser
         * some breathing time.
         */

        if (
            y % (
                CHUNK_HEIGHT * 8
            ) === 0
        ) {

            await sleep(0);
        }
    }
}


/* =========================================================
   GRAYSCALE
========================================================= */

function convertToGrayscale(
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

                0.587 *
                data[i + 1] +

                0.114 *
                data[i + 2]
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
   DESTROY CURRENT PDF
========================================================= */

async function destroyCurrentPDF() {

    if (!pdfDocument) {

        return;
    }


    try {

        await pdfDocument.destroy();

    } catch (error) {

        console.warn(
            "PDF destroy warning:",
            error
        );
    }


    pdfDocument =
        null;
}


/* =========================================================
   SLEEP
========================================================= */

function sleep(ms) {

    return new Promise(
        function (resolve) {

            setTimeout(
                resolve,
                ms
            );
        }
    );
}


/* =========================================================
   END
========================================================= */
