 src="https://cdn.tailwindcss.com"
  let books = [
    {
        title: "Java Programming",
        author: "James Gosling",
        category: "Programming",
        status: "Available"
    },
    {
        title: "HTML & CSS",
        author: "Jon Duckett",
        category: "Web Development",
        status: "Issued"
    },
    {
        title: "JavaScript",
        author: "Brendan Eich",
        category: "Programming",
        status: "Available"
    }
];
       function displayBooks(data) {
       
        updateCategoryFilter();
    let table = document.getElementById("bookTable");
    table.innerHTML = "";

    data.forEach((book, index) => {

        table.innerHTML += `
        <tr class="border-b border-gray-200 text-gray-900 hover:bg-gray-100">

            <td class="p-3">${book.title}</td>

            <td>${book.author}</td>

            <td>${book.category}</td>

            <td>
                <span class="px-3 py-1 rounded-full text-white ${
                    book.status === "Available"
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }">
                    ${book.status}
                </span>
            </td>

            <td class="space-x-2">

    ${
        isAdmin
        ? `
        <button
            onclick="toggleStatus(${index})"
            class="${
                book.status === "Available"
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-green-600 hover:bg-green-700"
            } text-white px-3 py-2 rounded-lg">

            ${
                book.status === "Available"
                ? "Issue"
                : "Return"
            }

        </button>

        <button
            onclick="deleteBook(${index})"
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg">
            Delete
        </button>
        `
        : `<span class="text-gray-400">Admin only</span>`
    }

</td>

        </tr>
        `;
    });

    updateDashboard();
}
           
    let isAdmin = false;
const ADMIN_PASSWORD = "admin123";

// Open modal
function openAdminLogin() {
    document.getElementById("adminModal").classList.remove("hidden");
}

// Close modal
function closeAdminLogin() {
    document.getElementById("adminModal").classList.add("hidden");
    document.getElementById("adminPass").value = "";
}

// Login check
function checkAdmin() {

    const pass = document.getElementById("adminPass").value;

    if (pass === ADMIN_PASSWORD) {

        isAdmin = true;

        document.getElementById("adminStatus").classList.remove("hidden");

        document.getElementById("addBtn").disabled = false;
        document.getElementById("addBtn").classList.remove("opacity-50", "cursor-not-allowed");

        closeAdminLogin();

        displayBooks(books);

        alert("Admin Login Successful");

    } else {

        alert("Wrong Password");

        document.getElementById("adminPass").value = "";
        document.getElementById("adminPass").focus();

    }

}
function logoutAdmin() {
    isAdmin = false;

    document.getElementById("adminStatus").classList.add("hidden");

    displayBooks(books);

    alert("Logged out of admin mode");
    document.getElementById("addBtn").disabled = true;
document.getElementById("addBtn").classList.add("opacity-50", "cursor-not-allowed");
}
      function addBook() {

    if (!isAdmin) {
        alert("Admin access required!");
        return;
    }

    let title = document.getElementById("title").value.trim();
    let author = document.getElementById("author").value.trim();
    let category = document.getElementById("category").value.trim();
    let status = document.getElementById("status").value;

    if (title === "" || author === "" || category === "") {
        alert("Please fill all fields.");
        return;
    }

    books.push({
        title,
        author,
        category,
        status
    });

    document.getElementById("title").value = "";
    document.getElementById("author").value = "";
    document.getElementById("category").value = "";
    document.getElementById("status").value = "Available";

    displayBooks(books);
}
        function deleteBook(index) {
    if (!isAdmin) {
        alert("Admin access required!");
        return;
    }
    books.splice(index, 1);
    displayBooks(books);
}
function toggleStatus(index) {

    if (!isAdmin) {
        alert("Admin access required!");
        return;
    }

    if (books[index].status === "Available") {
        books[index].status = "Issued";
    } else {
        books[index].status = "Available";
    }

    displayBooks(books);
}
        function searchBook() {

    let search = document.getElementById("search").value.toLowerCase();

    let category = document.getElementById("categorySearch").value;

    let filtered = books.filter(book => {

        let textMatch =
            book.title.toLowerCase().includes(search) ||
            book.author.toLowerCase().includes(search) ||
            book.category.toLowerCase().includes(search);

        let categoryMatch =
            category === "" || book.category === category;

        return textMatch && categoryMatch;
    });

    displayBooks(filtered);
}
function updateCategoryFilter() {

    let select = document.getElementById("categorySearch");

    let current = select.value;

    let categories = [...new Set(books.map(book => book.category))];

    select.innerHTML = `<option value="">All Categories</option>`;

    categories.forEach(cat => {

        select.innerHTML += `<option value="${cat}">${cat}</option>`;

    });

    select.value = current;
}
        function updateDashboard(){
            document.getElementById("totalBooks").innerHTML=books.length;
            let available=books.filter(book=>book.status==="Available").length;
            let issued=books.filter(book=>book.status==="Issued").length;
            document.getElementById("availableBooks").innerHTML=available;
            document.getElementById("issuedBooks").innerHTML=issued;
        }
        displayBooks(books);
        
        document.getElementById("adminPass").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        checkAdmin();
    }
    
});


