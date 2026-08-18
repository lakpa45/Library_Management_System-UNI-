 function searchCategory() {
        const input =
            document.getElementById("categorySearch")
            .value
            .toLowerCase()
            .trim();
        const cards =
            document.querySelectorAll(".category-card");
        cards.forEach(card => {
            const text =
                card.innerText.toLowerCase();
            if (text.includes(input)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    }
    document
        .getElementById("categorySearch")
        .addEventListener("input", searchCategory);
    document
        .getElementById("navSearch")
        .addEventListener("input", function () {
            const value =
                this.value.toLowerCase().trim();
            const cards =
                document.querySelectorAll(".category-card");
            cards.forEach(card => {
                if (
                    card.innerText
                    .toLowerCase()
                    .includes(value)
                ) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    window.addEventListener("scroll", function () {
        const header =
            document.querySelector(".header");
        if (window.scrollY > 50) {
            header.classList.add("is-stuck");
        } else {
            header.classList.remove("is-stuck");
        }
    });