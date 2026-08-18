const STORAGE_KEY = "Library_category";
        const defaultCategories = [
            {
                id: crypto.randomUUID(),
                name: "Fiction & Literature",
                desc: "Novels, short stories, and poetry collections.",
                count: 214,
                color: "#1B4332"
            },
            {
                id: crypto.randomUUID(),
                name: "Computer Science",
                desc: "Algorithms, software engineering, and system texts.",
                count: 158,
                color: "#4A5A8A"
            },
            {
                id: crypto.randomUUID(),
                name: "Mathematics & Statistics",
                desc: "Pure math, applied math, and probability.",
                count: 97,
                color: "#3E6B56"
            },
            {
                id: crypto.randomUUID(),
                name: "History",
                desc: "World, regional, and cultural histories.",
                count: 132,
                color: "#7A3B2E"
            },
            {
                id: crypto.randomUUID(),
                name: "Business & Economics",
                desc: "Management, finance, and economic theory.",
                count: 88,
                color: "#9E4A4A"
            },
            {
                id: crypto.randomUUID(),
                name: "Arts & Humanities",
                desc: "Philosophy, art history, and cultural studies.",
                count: 214,
                color: "#8A5A9E"
            }
        ];
        let categories = loadCategories();
        let deleteTargetId = null;
        function loadCategories() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    return JSON.parse(raw);
                }
                return defaultCategories;
            } catch (error) {
                console.error(
                    "Could not load categories:",
                    error
                );
                return defaultCategories;
            }
        }
        function saveCategories() {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(categories)
            );
        }
        const grid =
            document.getElementById("categoryGrid");
        const emptyState =
            document.getElementById("emptyState");
        const searchInput =
            document.getElementById("searchInput");
        const categoryModal =
            document.getElementById("categoryModal");
        const categoryForm =
            document.getElementById("categoryForm");
        const modalTitle =
            document.getElementById("modalTitle");
        const deleteModal =
            document.getElementById("deleteModal");
        function render() {
            const query =
                searchInput.value.trim().toLowerCase();
            const filtered =
                categories.filter(category => {
                    const name =
                        category.name.toLowerCase();
                    const description =
                        (category.desc || "").toLowerCase();
                    return (
                        name.includes(query) ||
                        description.includes(query)
                    );
                });
            grid.innerHTML = "";
            if (filtered.length === 0) {
                emptyState.classList.remove("hidden");
            } else {
                emptyState.classList.add("hidden");
                filtered.forEach(category => {
                    grid.appendChild(
                        buildCard(category)
                    );
                });
            }
            document.getElementById(
                "statCatCount"
            ).textContent = categories.length;
            const totalBooks =
                categories.reduce(
                    (total, category) =>
                        total + Number(category.count || 0),
                    0
                );
            document.getElementById(
                "statBookCount"
            ).textContent = totalBooks;
        }
        function buildCard(category) {
            const card =
                document.createElement("div");
            card.className =
                "card-hover bg-white border border-[#E4D9C4] rounded-xl p-5 flex flex-col justify-between";
            card.innerHTML = `
                <div>
                    <div class="flex items-start justify-between mb-3">
                        <span
                            class="inline-block w-10 h-10 rounded-lg"
                            style="background: ${category.color}"
                        ></span>
                        <div class="flex gap-1">
                            <!-- Edit -->
                            <button
                                type="button"
                                data-action="edit"
                                data-id="${category.id}"
                                class="p-1.5 rounded hover:bg-[#F5EFE6] text-[#4A5A50]"
                                title="Edit category"
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            </button>
                            <!-- Delete -->
                            <button
                                type="button"
                                data-action="delete"
                                data-id="${category.id}"
                                class="p-1.5 rounded hover:bg-[#F5EFE6] text-[#9E4A4A]"
                                title="Delete category"
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    stroke-width="2"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.863a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <h3 class="font-display text-lg font-semibold text-[#1B2A22] mb-1">
                        ${escapeHTML(category.name)}
                    </h3>
                    <p class="text-sm text-[#4A5A50] leading-snug">
                        ${escapeHTML(
                            category.desc ||
                            "No description yet."
                        )}
                    </p>
                </div>
                <div class="mt-4 pt-4 border-t border-[#F0E9DA] flex items-center justify-between">
                    <span class="text-xs uppercase tracking-wide text-[#8A7B5C]">
                        On shelf
                    </span>
                    <span class="number-font text-[#1B4332]">
                        ${Number(category.count || 0)}
                    </span>
                </div>
            `;
            return card;
        }
        function escapeHTML(value) {
            const div =
                document.createElement("div");
            div.textContent = value;
            return div.innerHTML;
        }
        grid.addEventListener("click", event => {
            const button =
                event.target.closest(
                    "button[data-action]"
                );
            if (!button) {
                return;
            }
            const id =
                button.dataset.id;
            if (button.dataset.action === "edit") {
                const category =
                    categories.find(
                        category => category.id === id
                    );
                if (category) {
                    openModal(category);
                }
            }
            if (button.dataset.action === "delete") {
                openDeleteModal(id);
            }
        });
        searchInput.addEventListener(
            "input",
            render
        );
        function openModal(category = null) {
            categoryForm.reset();
            document.getElementById(
                "categoryID"
            ).value =
                category ? category.id : "";
            document.getElementById(
                "categoryName"
            ).value =
                category ? category.name : "";
            document.getElementById(
                "categoryDesc"
            ).value =
                category ? category.desc : "";
            document.getElementById(
                "categoryCount"
            ).value =
                category ? category.count : 0;
            document.getElementById(
                "categoryColor"
            ).value =
                category
                    ? category.color
                    : "#1B4332";
            modalTitle.textContent =
                category
                    ? "Edit Category"
                    : "New Category";
            categoryModal.classList.remove(
                "hidden"
            );
            document.getElementById(
                "categoryName"
            ).focus();
        }
        function closeModal() {
            categoryModal.classList.add(
                "hidden"
            );
        }
        document
            .getElementById("openAddBtn")
            .addEventListener(
                "click",
                () => openModal()
            );
        document
            .getElementById("openAddBtnMobile")
            .addEventListener(
                "click",
                () => openModal()
            );
        document
            .getElementById("emptyAddBtn")
            .addEventListener(
                "click",
                () => openModal()
            );
        document
            .getElementById("closeModalBtn")
            .addEventListener(
                "click",
                closeModal
            );
        document
            .getElementById("cancelModalBtn")
            .addEventListener(
                "click",
                closeModal
            );
        categoryModal.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    categoryModal
                ) {
                    closeModal();
                }
            }
        );
        categoryForm.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                const id =
                    document.getElementById(
                        "categoryID"
                    ).value;
                const name =
                    document.getElementById(
                        "categoryName"
                    ).value.trim();
                const desc =
                    document.getElementById(
                        "categoryDesc"
                    ).value.trim();
                const count =
                    Number(
                        document.getElementById(
                            "categoryCount"
                        ).value
                    ) || 0;
                const color =
                    document.getElementById(
                        "categoryColor"
                    ).value;
                if (!name) {
                    return;
                }
                const data = {
                    name,
                    desc,
                    count,
                    color
                };
                if (id) {
                    const index =
                        categories.findIndex(
                            category =>
                                category.id === id
                        );
                    if (index !== -1) {
                        categories[index] = {
                            ...categories[index],
                            ...data
                        };
                    }
                }
                else {
                    categories.push({
                        id: crypto.randomUUID(),
                        ...data
                    });
                }
                saveCategories();
                closeModal();
                render();
            }
        );
        function openDeleteModal(id) {
            deleteTargetId = id;
            deleteModal.classList.remove(
                "hidden"
            );
        }
        function closeDeleteModal() {
            deleteTargetId = null;
            deleteModal.classList.add(
                "hidden"
            );
        }
        document
            .getElementById("cancelDeleteBtn")
            .addEventListener(
                "click",
                closeDeleteModal
            );
        deleteModal.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    deleteModal
                ) {
                    closeDeleteModal();
                }
            }
        );
        document
            .getElementById("confirmDeleteBtn")
            .addEventListener(
                "click",
                () => {
                    if (!deleteTargetId) {
                        return;
                    }
                    categories =
                        categories.filter(
                            category =>
                                category.id !==
                                deleteTargetId
                        );
                    saveCategories();
                    closeDeleteModal();
                    render();
                }
            );
        document.addEventListener(
            "keydown",
            event => {
                if (event.key !== "Escape") {
                    return;
                }
                if (
                    !categoryModal.classList.contains(
                        "hidden"
                    )
                ) {
                    closeModal();
                }
                if (
                    !deleteModal.classList.contains(
                        "hidden"
                    )
                ) {
                    closeDeleteModal();
                }
            }
        );
        render();