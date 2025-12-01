const toggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const body = document.body;
const addBtn = document.getElementById('add-task-btn')
const addModal = document.getElementById ('addModal')
const saveAddBtn = document.getElementById('saveAddModal');
const titleInput = document.getElementById('add-title');
const descInput = document.getElementById('add-description');
const dueInput = document.getElementById('add-due');
const errorMsg = document.getElementById('add-error');

const API_URL = "https://todo-endpoint.onrender.com/todos";
// const API_URL = "http://localhost:3000/todos";



const editModal = document.getElementById("editModal");
const editTitle = document.getElementById("edit-title");
const editDesc = document.getElementById("edit-description");
const editDue = document.getElementById("edit-due");
const saveEditBtn = document.getElementById("saveEditModal");
const closeEditModal = document.getElementById("closeEditModal");

let currentEditId = null;

const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const cancelDeleteBtn = document.getElementById("cancel-delete");

let currentDeleteId = null;

//theme
if (localStorage.getItem('theme') === 'light') {
  body.classList.add('light-mode');
  themeIcon.className = 'fas fa-moon';
}

toggleBtn.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  const isLight = body.classList.contains('light-mode');
  themeIcon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});


function toggleEmptyState() {
  const emptyState = document.getElementById("empty-state");
  const tasks = document.querySelectorAll(".task-item");

  if (tasks.length === 0) {
      emptyState.style.display = "flex"; 
  } else {
      emptyState.style.display = "none";   
  }
}

// READ/GET METHOD: fetchTodos()
async function fetchTodos() {
  try {
    const res = await fetch(API_URL);
    const todos = await res.json();
    renderTodos(todos);
  } catch (error) {
    console.error("Failed to fetch todos:", error);
  }
}

// to open the add task modal
addBtn.addEventListener('click', () =>{
  addModal.classList.add('show');
});

addModal.addEventListener("click", (e) => {
  if (e.target === addModal) {
    addModal.classList.remove("show");
  }
});

function clearErrorIfValid() {
  if (titleInput.value.trim() && dueInput.value.trim()) {
    errorMsg.classList.add('hide-error');
    errorMsg.classList.remove('error');
    errorMsg.textContent = ""; 
  }
}
titleInput.addEventListener('input', clearErrorIfValid);
dueInput.addEventListener('input', clearErrorIfValid);

// create tasks (POST)
saveAddBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const due = dueInput.value.trim();


  if (!title || !due){
    errorMsg.textContent = "Title and Due Date are required."
    errorMsg.classList.remove('hide-error');
    errorMsg.classList.add('error');
    return;

  }
  errorMsg.classList.add('hide-error');

  async function addTodo() {
    const newTodo = {
      title: titleInput.value.trim(),
      description: descInput.value.trim(),
      dueDate: dueInput.value.trim(),
      completed: false
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTodo)
      });

      await res.json();
      showNotification("Task added successfully");
      fetchTodos();  
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  }
    addTodo();
    addModal.classList.remove("show");
  
    titleInput.value = "";
    descInput.value = "";
    dueInput.value = "";
});


// function to display all tasks added in the task list
function renderTodos(todos) {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  const now = new Date();

  todos.forEach(todo => {
    const li = document.createElement("li");

    li.className = "task-item";
    li.dataset.id = todo.id;
    li.dataset.completed = todo.completed;

    if (todo.completed) li.classList.add("completed");

    let dueDateHTML = "";

    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);

      // Overdue
      if (!todo.completed && dueDate < now) {
        li.classList.add("overdue");
      }
      
      dueDateHTML = `<span class="task-date">Due: ${dueDate.toLocaleString()}</span>`;
    }

    li.innerHTML = `
      <div class="task-left">
        <button class="circle-btn" data-id="${todo.id}">
          <i class="fa-solid fa-check check-icon"></i>
        </button>

        <div class="task-info">
          <h3 class="task-title">${todo.title}</h3>
          ${todo.description ? `<p class="task-desc">${todo.description}</p>` : ""}
          ${todo.dueDate ? `<span class="task-date">Due: ${todo.dueDate}</span>` : ""}
        </div>
      </div>

      <div class="task-actions">
        <button class="edit-btn" data-id="${todo.id}">
          <i class="fa-solid fa-pen"></i>
        </button>

        <button class="delete-btn" data-id="${todo.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    list.appendChild(li);
  });

  handleCompleteToggle();
  toEditTask();
  toDeleteTask();
  toggleEmptyState();

}

// function to edit To-do
function toEditTask() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      currentEditId = btn.dataset.id;

      // fetch the task details
      const res = await fetch(`${API_URL}/${currentEditId}`);
      const todo = await res.json();

      editTitle.value = todo.title;
      editDesc.value = todo.description;
      editDue.value = todo.dueDate;

      editModal.classList.add("show");
    });
  });
}


//Update to-do tasks
saveEditBtn.addEventListener("click", async () => {
  await fetch(`${API_URL}/${currentEditId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: editTitle.value.trim(),
      description: editDesc.value.trim(),
      dueDate: editDue.value
    })
  });

  editModal.classList.remove("show");
  showNotification("Task updated successfully");
  fetchTodos();
});

closeEditModal.addEventListener("click", () => {
  editModal.classList.remove("show");
});

//Delete TO-DO
function toDeleteTask() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentDeleteId = btn.dataset.id;
      deleteModal.classList.add("show");
    });
  });
}

cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.classList.remove("show");
});

confirmDeleteBtn.addEventListener("click", async () => {
  await fetch(`${API_URL}/${currentDeleteId}`, { method: "DELETE" });

  deleteModal.classList.remove("show");
  showNotification("Task deleted");
  fetchTodos();
});

// function to show success notification
function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  container.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3500);
}


//Tick to-do as completed
function handleCompleteToggle() {
  document.querySelectorAll(".circle-btn").forEach(circle => {
    circle.addEventListener("click", async () => {
      const id = circle.dataset.id;

      const li = circle.closest("li");
      const newStatus = !(li.dataset.completed === "true");

      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newStatus })
      });

      fetchTodos();
    });
  });
}


// Filter tasks
document.querySelector(".filters").addEventListener("click", e => {
  if (!e.target.classList.contains("filter-btn")) return;

  document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
  e.target.classList.add("active");

  const filter = e.target.textContent.trim();
  const items = document.querySelectorAll(".task-item");

  items.forEach(item => {
    const done = item.dataset.completed === "true";

    if (filter === "All") item.style.display = "flex";
    if (filter === "Active") item.style.display = done ? "none" : "flex";
    if (filter === "Completed") item.style.display = done ? "flex" : "none";
  });
});


document.getElementById("clear-completed").addEventListener("click", async () => {
  const completed = document.querySelectorAll(".task-item.completed");

  for (let li of completed) {
    const id = li.dataset.id;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  }

  fetchTodos();
});

window.addEventListener("DOMContentLoaded", fetchTodos);
