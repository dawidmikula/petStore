const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

// Obsługa rozwijania i zwijania menu nawigacyjnego
if (bar) bar.addEventListener('click', () => nav.classList.add('active'));
if (close) close.addEventListener('click', () => nav.classList.remove('active'));

// Dynamiczne ładowanie sekcji HTML
["newsletter", "products", "footer"].forEach(section => {
    fetch(`static-htmls/${section}.html`)
        .then(response => response.text())
        .then(data => {
            if (section === "newsletter") {
                document.querySelector("script[data-load-newsletter]").insertAdjacentHTML("beforebegin", data);
            } else if (section === "products") {
                document.querySelector("#product1").innerHTML = data;
            } else {
                document.body.insertAdjacentHTML("beforeend", data);
            }
        });
});

// Obsługa koszyka
document.addEventListener("DOMContentLoaded", () => {
    const cartTableBody = document.querySelector("#cart tbody");
    const cartSubtotalElement = document.getElementById("cart-subtotal");
    const cartTotalElement = document.getElementById("cart-total");
    const couponInput = document.querySelector(".coupon input");
    const applyCouponButton = document.querySelector(".coupon button");

    let cart = [];
    let discountPercentage = 0;

    // Wczytanie danych koszyka
    fetch("jsons/cart.json")
        .then(response => response.json())
        .then(data => {
            cart = data;
            updateCart();
        });

    function updateCart() {
        cartTableBody.innerHTML = "";
        let total = 0;

        cart.forEach((item, index) => {
            const row = document.createElement("tr");
            row.setAttribute("draggable", "true");
            row.setAttribute("data-index", index);
            row.classList.add("draggable");

            row.innerHTML = `
                <td>
                    <span class="drag-handle">↕</span>
                    <button class="remove-item" data-index="${index}">X</button>
                </td>
                <td><img src="${item.image}" width="50"></td>
                <td>${item.name}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td><input type="number" class="change-quantity" data-index="${index}" value="${item.quantity}" min="1"></td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            `;

            cartTableBody.appendChild(row);
            total += item.price * item.quantity;
        });

        if (discountPercentage > 0) {
            total *= (1 - discountPercentage / 100);
        }

        cartSubtotalElement.textContent = `$${total.toFixed(2)}`;
        cartTotalElement.textContent = `$${total.toFixed(2)}`;

        addDragAndDropListeners();
    }

    // Usuwanie produktu z koszyka
    cartTableBody.addEventListener("click", (event) => {
        if (event.target.classList.contains("remove-item")) {
            const index = event.target.dataset.index;
            cart.splice(index, 1);
            updateCart();
        }
    });

    // Obsługa zmiany liczby sztuk
    cartTableBody.addEventListener("input", (event) => {
        if (event.target.classList.contains("change-quantity")) {
            const index = event.target.dataset.index;
            let newQuantity = parseInt(event.target.value);

            if (isNaN(newQuantity) || newQuantity < 1 || !Number.isInteger(newQuantity)) {
                alert("❌ Invalid quantity! Please enter a whole number greater than 0.");
                newQuantity = 1;
            }

            cart[index].quantity = newQuantity;
            updateCart();
        }
    });

    // Obsługa kuponów
    applyCouponButton.addEventListener("click", () => {
        const enteredCode = couponInput.value.trim().toLowerCase();
        fetch("codes.txt")
            .then(response => response.text())
            .then(data => {
                const validCodes = data.split("\n").map(code => code.trim().toLowerCase());
                if (validCodes.includes(enteredCode)) {
                    const discountMatch = enteredCode.match(/save(\d+)/);
                    if (discountMatch) {
                        discountPercentage = parseInt(discountMatch[1]);
                        updateCart();
                        alert(`✅ Discount applied! -${discountPercentage}% off your total.`);
                    }
                } else {
                    alert("❌ Invalid coupon code. Please try again.");
                }
            })
            .catch(error => console.error("Error loading discount codes:", error));
    });

    // Drag & Drop - obsługa zmiany kolejności produktów
    function addDragAndDropListeners() {
        const rows = document.querySelectorAll(".draggable");

        rows.forEach(row => {
            row.addEventListener("dragstart", handleDragStart);
            row.addEventListener("dragover", handleDragOver);
            row.addEventListener("drop", handleDrop);
            row.addEventListener("dragend", handleDragEnd);
        });
    }

    let draggedRowIndex = null;

    function handleDragStart(event) {
        draggedRowIndex = event.target.dataset.index;
        event.target.classList.add("dragging");
    }

    function handleDragOver(event) {
        event.preventDefault();
        const targetRow = event.target.closest("tr");
        if (!targetRow || targetRow.dataset.index === draggedRowIndex) return;
        cartTableBody.insertBefore(
            document.querySelector(`tr[data-index="${draggedRowIndex}"]`),
            targetRow.nextSibling
        );
    }

    function handleDrop(event) {
        event.preventDefault();
        const targetRowIndex = event.target.closest("tr").dataset.index;
        if (draggedRowIndex === targetRowIndex) return;

        // Zamiana elementów w tablicy `cart`
        const draggedItem = cart.splice(draggedRowIndex, 1)[0];
        cart.splice(targetRowIndex, 0, draggedItem);

        updateCart();
    }

    function handleDragEnd() {
        document.querySelectorAll(".dragging").forEach(row => row.classList.remove("dragging"));
        draggedRowIndex = null;
    }
});


// Obsługa formularza kontaktowego
document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contact-form");
    const acceptCheckbox = document.getElementById("accept-regulations");

    if (contactForm) {
        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const subject = document.getElementById("subject").value.trim();
            const message = document.getElementById("message").value.trim();

            if (!name || !email || !subject || !message) {
                alert("Please fill in all fields.");
                return;
            }

            if (!acceptCheckbox.checked) {
                alert("❌ You must accept the regulations to proceed.");
                return;
            }

            alert(`✅ Your message has been sent successfully!\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`);
            contactForm.reset();
        });
    }
});

// Dynamiczne ładowanie headera i newslettera
document.addEventListener("DOMContentLoaded", () => {
    fetch("static-htmls/header.html")
        .then(response => response.text())
        .then(data => {
            document.body.insertAdjacentHTML("afterbegin", data);
            setupNewsletterForm();
        });

    function setupNewsletterForm() {
        const emailInput = document.getElementById("newsletter-email");
        const submitButton = document.getElementById("newsletter-submit");
        const messageBox = document.getElementById("newsletter-message");

        if (submitButton) {
            submitButton.addEventListener("click", (event) => {
                event.preventDefault();
                const email = emailInput.value.trim();
                if (!validateEmail(email)) {
                    messageBox.textContent = "❌ Please enter a valid email address!";
                    messageBox.style.color = "red";
                    messageBox.style.display = "block";
                    hideMessageAfterDelay();
                    return;
                }
                messageBox.textContent = "✅ Thank you for subscribing to our newsletter!";
                messageBox.style.color = "green";
                messageBox.style.display = "block";
                emailInput.value = "";
                hideMessageAfterDelay();
            });
        }
    }

    function validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    function hideMessageAfterDelay() {
        setTimeout(() => {
            document.getElementById("newsletter-message").style.display = "none";
        }, 3000);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const currentPage = window.location.pathname.split("/").pop().toLowerCase();
        if (!currentPage) {
            currentPage = "index.html"; // Domyślnie traktujemy stronę główną jako index.html
        }

        document.querySelectorAll("#navbar a").forEach(link => {
            const linkHref = link.getAttribute("href").toLowerCase();

            if (currentPage === linkHref) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });

        console.log("Podświetlona strona:", currentPage); // Debug w konsoli
    }, 100); // Krótkie opóźnienie dla pewności
});

document.addEventListener("DOMContentLoaded", function () {
    let blogData = [];
    let filteredData = [];
    let currentPage = 1;
    const postsPerPage = 5;

    // Pobierz dane bloga z JSON
    fetch("jsons/blog-data.json")
        .then(response => response.json())
        .then(data => {
            blogData = data;
            setDefaultDate(); // Ustawienie domyślnej daty na dzisiejszą
            filterByToday(); // Automatyczne filtrowanie postów z aktualnego dnia
        })
        .catch(error => console.error("Error loading blog data:", error));

    function setDefaultDate() {
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("blog-date").value = today;
    }

    function filterByToday() {
        const today = new Date().toISOString().split("T")[0];
        filteredData = blogData.filter(post => post.date === today);
        if (filteredData.length === 0) {
            document.getElementById("filter-message").textContent = "⚠ No blog posts found for today.";
            document.getElementById("filter-message").style.color = "orange";
        } else {
            document.getElementById("filter-message").textContent = `✅ Showing results for ${today}`;
            document.getElementById("filter-message").style.color = "green";
        }
        currentPage = 1;
        loadBlogPosts();
        renderPagination();
    }

    function loadBlogPosts() {
        const blogContainer = document.getElementById("blog");
        blogContainer.innerHTML = "";

        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = Math.min(startIndex + postsPerPage, filteredData.length);
        const paginatedPosts = filteredData.slice(startIndex, endIndex);

        if (!paginatedPosts.length) {
            blogContainer.innerHTML = `<p style="text-align:center; font-size:18px;">⚠ No posts found.</p>`;
            return;
        }

        paginatedPosts.forEach(post => {
            const blogBox = document.createElement("div");
            blogBox.classList.add("blog-box");
            blogBox.setAttribute("data-date", post.date);
            blogBox.innerHTML = `
                <div class="blog-img">
                    <img src="${post.image}" alt="">
                </div>
                <div class="blog-details">
                    <h4>${post.title}</h4>
                    <p>${post.description}</p>
                    <a href="#">CONTINUE READING</a>
                </div>
                <h1>${post.date.slice(5, 10)}</h1>
            `;
            blogContainer.appendChild(blogBox);
        });

        updatePagination();
    }

    function renderPagination() {
        const paginationContainer = document.getElementById("pagination");
        paginationContainer.innerHTML = "";
        const totalPages = Math.ceil(filteredData.length / postsPerPage);
        if (totalPages <= 1 || filteredData.length < 4) return;

        createPaginationButton("prev", "←", () => changePage(currentPage - 1));
        for (let i = 1; i <= totalPages; i++) {
            createPaginationButton(i, i, () => changePage(i));
        }
        createPaginationButton("next", "→", () => changePage(currentPage + 1));
    }

    function createPaginationButton(className, content, action) {
        const button = document.createElement("a");
        button.textContent = content;
        button.href = "#";
        button.addEventListener("click", event => {
            event.preventDefault();
            action();
        });
        document.getElementById("pagination").appendChild(button);
    }

    function changePage(newPage) {
        const totalPages = Math.ceil(filteredData.length / postsPerPage);
        if (newPage < 1 || newPage > totalPages) return;
        currentPage = newPage;
        loadBlogPosts();
    }

    function updatePagination() {
        const paginationContainer = document.getElementById("pagination");
        const buttons = paginationContainer.querySelectorAll("a");
        buttons.forEach(button => button.classList.remove("active"));
        if (buttons.length > 2) {
            buttons[currentPage].classList.add("active");
        }
    }

    document.getElementById("filter-date").addEventListener("click", function () {
        const selectedDate = document.getElementById("blog-date").value;
        const filterMessage = document.getElementById("filter-message");

        if (!selectedDate) {
            filterMessage.textContent = "❌ Please select a date!";
            filterMessage.style.color = "red";
            return;
        }

        filteredData = blogData.filter(post => post.date === selectedDate);
        currentPage = 1;
        filterMessage.textContent = filteredData.length
            ? `✅ Showing results for ${selectedDate}`
            : "⚠ No blog posts found for this date.";
        filterMessage.style.color = filteredData.length ? "green" : "orange";

        loadBlogPosts();
        renderPagination();
    });

    document.getElementById("reset-date").addEventListener("click", function () {
        document.getElementById("blog-date").value = ""; // WYCZYSZCZENIE POLA DATY
        document.getElementById("filter-message").textContent = "";
        filteredData = [...blogData];
        currentPage = 1;
        loadBlogPosts();
        renderPagination();
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const profileForm = document.getElementById("profile-form");
    const deleteProfileButton = document.getElementById("delete-profile");

    if (profileForm) {
        // Wczytaj dane profilu po załadowaniu strony
        loadProfileData();

        profileForm.addEventListener("submit", function (event) {
            event.preventDefault();

            // Pobierz wartości pól formularza
            const firstName = document.getElementById("first-name").value.trim();
            const lastName = document.getElementById("last-name").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const address = document.getElementById("address").value.trim();
            const dob = document.getElementById("dob").value;
            const bio = document.getElementById("bio").value.trim();

            // Czyszczenie poprzednich błędów
            clearErrors();

            let isValid = true;

            // Walidacja wymaganych pól
            if (firstName === "") {
                showError("error-first-name", "First name is required.");
                isValid = false;
            }
            if (lastName === "") {
                showError("error-last-name", "Last name is required.");
                isValid = false;
            }
            if (!validateEmail(email)) {
                showError("error-email", "Invalid email format.");
                isValid = false;
            }
            if (phone === "") {
                showError("error-phone", "Phone number is required.");
                isValid = false;
            }
            if (address === "") {
                showError("error-address", "Address is required.");
                isValid = false;
            }
            if (!isValidAge(dob)) {
                showError("error-dob", "You must be at least 13 years old.");
                isValid = false;
            }

            if (!isValid) {
                return;
            }

            // Zapis danych do localStorage
            const profileData = { firstName, lastName, email, phone, address, dob, bio };
            localStorage.setItem("profileData", JSON.stringify(profileData));

            alert("✅ Profile updated successfully!");
        });

        // Obsługa przycisku usuwania profilu
        deleteProfileButton.addEventListener("click", function () {
            if (confirm("⚠ Are you sure you want to delete your profile? This action cannot be undone!")) {
                localStorage.removeItem("profileData"); // Usuń dane z localStorage
                profileForm.reset(); // Wyczyść formularz
                clearErrors();
                alert("🗑 Profile deleted successfully!");
            }
        });
    }

    function loadProfileData() {
        const savedData = localStorage.getItem("profileData");
        if (savedData) {
            const profileData = JSON.parse(savedData);

            document.getElementById("first-name").value = profileData.firstName;
            document.getElementById("last-name").value = profileData.lastName;
            document.getElementById("email").value = profileData.email;
            document.getElementById("phone").value = profileData.phone;
            document.getElementById("address").value = profileData.address;
            document.getElementById("dob").value = profileData.dob;
            document.getElementById("bio").value = profileData.bio;
        }
    }

    // Funkcja walidująca wiek (minimum 13 lat)
    function isValidAge(dob) {
        if (!dob) return false;

        const birthDate = new Date(dob);
        const today = new Date();

        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        if (age < 13 || (age === 13 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
            return false;
        }

        return true;
    }

    // Funkcja walidująca format emaila
    function validateEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // Funkcja wyświetlająca błąd pod polem
    function showError(id, message) {
        const errorElement = document.getElementById(id);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.color = "red";
            errorElement.style.fontSize = "14px";
            errorElement.style.marginTop = "5px";
        }
    }

    // Funkcja czyszcząca wszystkie błędy
    function clearErrors() {
        const errorMessages = document.querySelectorAll(".error-message");
        errorMessages.forEach(error => {
            error.textContent = "";
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    let products = [];
    let currentPage = 1;
    const productsPerPage = 8;

    // Pobierz dane z `products.json`
    fetch("jsons/products.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Błąd ładowania pliku products.json");
            }
            return response.json();
        })
        .then(data => {
            products = data;
            renderPagination(products.length);
            loadProducts(); // Automatyczne ładowanie pierwszej strony
            clickFirstPage(); // Kliknięcie strony 1 automatycznie
        })
        .catch(error => console.error("Error loading products:", error));

    // Funkcja generująca produkty na stronie
    function loadProducts() {
        if (!products.length) return; // Zapobiega błędom, jeśli produkty nie zostały załadowane

        const productContainer = document.getElementById("product1");
        productContainer.innerHTML = `<div class="pro-container"></div>`; // Wyczyść poprzednie produkty
        const proContainer = productContainer.querySelector(".pro-container");

        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = products.slice(startIndex, endIndex);

        paginatedProducts.forEach(product => {
            const productElement = document.createElement("div");
            productElement.classList.add("pro");
            productElement.innerHTML = `
                <img src="${product.image}" alt="">
                <div class="des">
                    <span>${product.brand}</span>
                    <h5>${product.name}</h5>
                    <div class="star">${generateStars(product.stars)}</div>
                    <h4>$${product.price}</h4>
                </div>
                <a href="${product.link}"><i class="fas fa-shopping-cart cart"></i></a>
            `;
            proContainer.appendChild(productElement);
        });

        scrollToTop();
        updatePagination();
    }

    // Generowanie paginacji
    function renderPagination(totalProducts) {
        const paginationContainer = document.getElementById("pagination");
        paginationContainer.innerHTML = ""; // Wyczyść paginację

        const totalPages = Math.ceil(totalProducts / productsPerPage);
        if (totalPages <= 1) return; // Ukryj paginację, jeśli tylko 1 strona

        const prevArrow = document.createElement("a");
        prevArrow.innerHTML = `<i class="fas fa-long-arrow-alt-left"></i>`;
        prevArrow.href = "#";
        prevArrow.classList.add("prev");
        prevArrow.addEventListener("click", function (event) {
            event.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                loadProducts();
            }
        });
        paginationContainer.appendChild(prevArrow);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement("a");
            pageButton.textContent = i;
            pageButton.href = "#";
            if (i === currentPage) pageButton.classList.add("active");
            pageButton.addEventListener("click", function (event) {
                event.preventDefault();
                currentPage = i;
                loadProducts();
            });

            paginationContainer.appendChild(pageButton);
        }

        const nextArrow = document.createElement("a");
        nextArrow.innerHTML = `<i class="fas fa-long-arrow-alt-right"></i>`;
        nextArrow.href = "#";
        nextArrow.classList.add("next");
        nextArrow.addEventListener("click", function (event) {
            event.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                loadProducts();
            }
        });
        paginationContainer.appendChild(nextArrow);

        updatePagination();
    }

    // Aktualizacja aktywnej paginacji
    function updatePagination() {
        const paginationContainer = document.getElementById("pagination");
        const pageButtons = paginationContainer.querySelectorAll("a");

        pageButtons.forEach(button => button.classList.remove("active", "disabled"));

        if (pageButtons.length > 2) {
            pageButtons[currentPage].classList.add("active");
        }

        if (currentPage === 1) {
            paginationContainer.querySelector(".prev").classList.add("disabled");
        }
        if (currentPage === Math.ceil(products.length / productsPerPage)) {
            paginationContainer.querySelector(".next").classList.add("disabled");
        }
    }

    function generateStars(count) {
        return '<i class="fas fa-star"></i>'.repeat(count);
    }

    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // Funkcja klikająca automatycznie stronę 1 po załadowaniu
    function clickFirstPage() {
        const firstPageButton = document.querySelector("#pagination a:nth-child(3)"); // Pierwszy przycisk numerowany
        if (firstPageButton) {
            firstPageButton.click();
        }
    }
});



document.addEventListener("DOMContentLoaded", function () {
    fetch("jsons/products.json")
        .then(response => response.json())
        .then(data => {
            loadFeaturedProducts(data);
            loadNewArrivals(data);
        })
        .catch(error => console.error("Error loading products:", error));

    // Wczytaj pierwsze 8 produktów jako "Featured Products"
    function loadFeaturedProducts(products) {
        const productContainer = document.querySelector("#product1-featured .pro-container");
        productContainer.innerHTML = "";

        products.slice(0, 8).forEach(product => {
            const productElement = createProductElement(product);
            productContainer.appendChild(productElement);
        });
    }

    // Wczytaj kolejne 8 produktów jako "New Arrivals"
    function loadNewArrivals(products) {
        const productContainer = document.querySelector("#product1-new .pro-container");
        productContainer.innerHTML = "";

        products.slice(8, 16).forEach(product => {
            const productElement = createProductElement(product);
            productContainer.appendChild(productElement);
        });
    }

    // Funkcja generująca element produktu
    function createProductElement(product) {
        const productElement = document.createElement("div");
        productElement.classList.add("pro");

        productElement.innerHTML = `
            <img src="${product.image}" alt="">
            <div class="des">
                <span>${product.brand}</span>
                <h5>${product.name}</h5>
                <div class="star">${generateStars(product.stars)}</div>
                <h4>$${product.price}</h4>
            </div>
            <a href="${product.link}"><i class="fas fa-shopping-cart cart"></i></a>
        `;

        return productElement;
    }

    // Generowanie gwiazdek
    function generateStars(count) {
        return '<i class="fas fa-star"></i>'.repeat(count);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Pobranie wszystkich elementów z klasą phone-wrapper
    const phoneWrappers = document.querySelectorAll(".phone-wrapper");

    phoneWrappers.forEach(wrapper => {
        // Pobranie ukrytego numeru telefonu i tekstu "Hover to show number"
        const hoverText = wrapper.querySelector(".hover-text");
        const phoneNumber = wrapper.querySelector(".phone-number");

        // Obsługa zdarzenia 'mouseenter' (najechanie myszką)
        wrapper.addEventListener("mouseenter", function () {
            hoverText.style.display = "none"; // Ukrycie tekstu "Hover to show number"
            phoneNumber.style.display = "inline"; // Pokazanie numeru telefonu
        });

        // Obsługa zdarzenia 'mouseleave' (opuszczenie myszką)
        wrapper.addEventListener("mouseleave", function () {
            hoverText.style.display = "inline"; // Przywrócenie tekstu
            phoneNumber.style.display = "none"; // Ukrycie numeru telefonu
        });
    });
});
