/* =========================================
   DIGITAL TO PRINTABLE
   ADVANCED SCRIPT - PART 1
========================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/* =========================================
   VARIABLES
========================================= */

let pdfDocument = null;

let slides = [];

let deletedHistory = [];

let selectedSlideIds = new Set();

let slideCounter = 0;


/* =========================================
   ELEMENTS
========================================= */

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

const margin =
    document.getElementById("margin");

const spacing =
    document.getElementById("spacing");

const marginValue =
    document.getElementById("marginValue");

const spacingValue =
    document.getElementById("spacingValue");

const generateBtn =
    document.getElementById("generateBtn");

const statusMessage =
    document.getElementById("statusMessage");


/* =========================================
   PDF UPLOAD
========================================= */

fileInput.addEventListener(
    "change",
    handlePDFUpload
);


async function handlePDFUpload(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }


    /* Check PDF */

    if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    ) {

        alert(
            "Please select a valid PDF file."
        );

        fileInput.value = "";

        return;
    }


    /* Reset old data */

    pdfDocument = null;

    slides = [];

    deletedHistory = [];

    selectedSlideIds.clear();

    slideCounter = 0;


    /* File name */

    fileName.textContent =
        "📄 " + file.name;


    /* Loading */

    statusMessage.textContent =
        "⏳ Loading PDF...";


    slidesContainer.innerHTML =
        '<div class="loading">Loading PDF...</div>';


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


        updateInformation();

        updateGenerateButton();


        statusMessage.textContent =
            "✅ PDF loaded successfully.";


    } catch (error) {

        console.error(error);

        slidesContainer.innerHTML =
            '<div class="empty-message">Unable to read this PDF.</div>';

        statusMessage.textContent =
            "❌ PDF could not be loaded.";

        alert(
            "PDF load error. Please try another PDF."
        );
    }
}


/* =========================================
   RENDER ALL SLIDES
========================================= */

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


/* =========================================
   RENDER SINGLE SLIDE
========================================= */

async function renderSlide(pageNumber) {

    const page =
        await pdfDocument.getPage(pageNumber);


    const viewport =
        page.getViewport({
            scale: 1
        });


    const canvas =
        document.createElement("canvas");


    const context =
        canvas.getContext("2d");


    const maxWidth = 300;


    const scale =
        Math.min(
            1.5,
            maxWidth / viewport.width
        );


    const scaledViewport =
        page.getViewport({
            scale: scale
        });


    canvas.width =
        scaledViewport.width;

    canvas.height =
        scaledViewport.height;


    await page.render({

        canvasContext: context,

        viewport: scaledViewport

    }).promise;


    /* Slide object */

    const slide = {

        id: ++slideCounter,

        pageNumber: pageNumber,

        canvas: canvas

    };


    slides.push(slide);


    createSlideCard(slide);
}


/* =========================================
   CREATE SLIDE CARD
========================================= */

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
        "Slide " +
        slide.pageNumber;


    card.appendChild(check);

    card.appendChild(slide.canvas);

    card.appendChild(number);


    card.addEventListener(
        "click",
        () => toggleSlide(slide.id)
    );


    slidesContainer.appendChild(card);
}


/* =========================================
   TOGGLE SLIDE
========================================= */

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
}


/* =========================================
   UPDATE SLIDE VISUALS
========================================= */

function updateSlideVisuals() {

    const cards =
        document.querySelectorAll(
            ".slide-card"
        );


    cards.forEach(card => {

        const id =
            Number(card.dataset.id);


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

    });
}


/* =========================================
   SELECT ALL
========================================= */

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
}


/* =========================================
   CLEAR ALL
========================================= */

clearAllBtn.addEventListener(
    "click",
    clearAllSlides
);


function clearAllSlides() {

    selectedSlideIds.clear();


    updateSlideVisuals();

    updateInformation();

    updateGenerateButton();
}


/* =========================================
   DELETE SELECTED
========================================= */

deleteBtn.addEventListener(
    "click",
    deleteSelectedSlides
);


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


    statusMessage.textContent =
        "🗑️ Selected slides deleted.";
}


/* =========================================
   UNDO DELETE
========================================= */

undoBtn.addEventListener(
    "click",
    undoDelete
);


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


    statusMessage.textContent =
        "↩️ Delete undone.";
}


/* =========================================
   REDRAW SLIDES
========================================= */

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
}


/* =========================================
   INFORMATION
========================================= */

function updateInformation() {

    selectedSlides.textContent =
        selectedSlideIds.size;


    const perPage =
        Number(
            slidesPerPage.value
        );


    slidesPerPageInfo.textContent =
        perPage;


    if (slides.length > 0) {

        const originalPages =
            slides.length;


        const printablePages =
            Math.ceil(
                slides.length /
                perPage
            );


        const saving =
            Math.max(
                0,
                Math.round(
                    (
                        1 -
                        printablePages /
                        originalPages
                    ) * 100
                )
            );


        paperSaving.textContent =
            saving + "%";

    } else {

        paperSaving.textContent =
            "0%";
    }
}


/* =========================================
   SLIDES PER PAGE
========================================= */

slidesPerPage.addEventListener(
    "change",
    () => {

        updateInformation();

        updatePreview();
    }
);


/* =========================================
   MARGIN
========================================= */

margin.addEventListener(
    "input",
    () => {

        marginValue.textContent =
            margin.value;

        updatePreview();
    }
);


/* =========================================
   SPACING
========================================= */

spacing.addEventListener(
    "input",
    () => {

        spacingValue.textContent =
            spacing.value;

        updatePreview();
    }
);


/* =========================================
   GENERATE BUTTON
========================================= */

function updateGenerateButton() {

    generateBtn.disabled =
        slides.length === 0 ||
        selectedSlideIds.size === 0;
}


/* =========================================
   INITIAL STATE
========================================= */

updateInformation();

updateGenerateButton();


/* =========================================
   PREVIEW
========================================= */

function updatePreview() {

    const preview =
        document.getElementById(
            "previewContainer"
        );


    if (
        slides.length === 0 ||
        selectedSlideIds.size === 0
    ) {

        preview.innerHTML =
            '<div class="empty-message">Print preview will appear here.</div>';

        return;
    }


    const perPage =
        Number(
            slidesPerPage.value
        );


    const selectedSlides =
        slides.filter(slide =>
            selectedSlideIds.has(
                slide.id
            )
        );


    preview.innerHTML = "";


    const pageCount =
        Math.ceil(
            selectedSlides.length /
            perPage
        );


    const info =
        document.createElement("div");


    info.className =
        "empty-message";


    info.textContent =
        `Preview: ${pageCount} printable page(s)`;

    preview.appendChild(info);
}
