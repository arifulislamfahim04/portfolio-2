/* -----------------------------------------------------------
   GLOBAL STATE & CONFIG
----------------------------------------------------------- */
const CONFIG = {
    pdfPath: './assets/cv.pdf', // Path to your PDF
    jsonPaths: {
        profile: './data/profile.json',
        resume: './data/resume.json',
        projects: './data/projects.json',
        blog: './data/blog.json'
    }
};

const state = {
    projects: [],
    blogPosts: []
};

/* -----------------------------------------------------------
   INIT & DATA FETCHING
----------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial UI Setup
    initTheme();
    setupNavigation();
    setupMobileMenu();
    setupCVActions();
    
    // 2. Fetch All Data
    try {
        await Promise.all([
            fetchAndRenderProfile(),
            fetchAndRenderResume(),
            fetchAndRenderProjects(),
            fetchAndRenderBlog()
        ]);
        
        // 3. Remove Preloader
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            preloader.style.opacity = '0';
            setTimeout(() => preloader.style.display = 'none', 500);
        }, 800);

    } catch (error) {
        console.error("Data loading failed:", error);
        document.getElementById('preloader').innerHTML = '<p style="color:red">Failed to load content. Check console.</p>';
    }
    
    // 4. Update Year
    document.getElementById('year').textContent = new Date().getFullYear();
});

/* -----------------------------------------------------------
   RENDER FUNCTIONS
----------------------------------------------------------- */
async function fetchAndRenderProfile() {
    const res = await fetch(CONFIG.jsonPaths.profile);
    const data = await res.json();
    
    // Sidebar Profile
    const sidebarHTML = `
        <div class="profile-header">
            <div class="avatar-container">
                <img src="${data.avatar}" alt="${data.name}" class="avatar">
            </div>
            <h1 class="profile-name">${data.name}</h1>
            <div class="typing-container">
                <span id="typing-text"></span><span class="cursor">|</span>
            </div>
            <div class="profile-socials">
                ${data.socials.map(s => `<a href="${s.url}" target="_blank" aria-label="${s.platform}"><i class='bx ${s.icon}'></i></a>`).join('')}
            </div>
        </div>
    `;
    document.getElementById('sidebar-profile-data').innerHTML = sidebarHTML;

    // About Section
    const aboutHTML = `
        <div class="card full-width">
            <h3 style="margin-bottom:15px;">Who I am</h3>
            <p class="bio-text">${data.bio}</p>
        </div>
        <div class="card-group-title full-width" style="margin-top:20px; font-weight:600;">Services</div>
        ${data.services.map(s => `
            <div class="card service-card">
                <div class="icon-box"><i class='bx ${s.icon}'></i></div>
                <h3>${s.title}</h3>
                <p class="bio-text">${s.desc}</p>
            </div>
        `).join('')}
    `;
    document.getElementById('about-content').innerHTML = aboutHTML;

    // Contact Info
    const contactHTML = `
        <h3>Contact Info</h3>
        <p class="bio-text" style="margin-bottom:20px;">${data.contactMessage}</p>
        ${data.contactDetails.map(d => `
            <div class="contact-info-item">
                <i class='bx ${d.icon}'></i>
                <div>
                    <span style="display:block; font-size:0.8rem; color:var(--text-muted);">${d.label}</span>
                    <span style="font-weight:500;">${d.value}</span>
                </div>
            </div>
        `).join('')}
    `;
    document.getElementById('contact-info').innerHTML = contactHTML;

    // Init Typing Effect
    initTypingEffect(data.roles);
}

async function fetchAndRenderResume() {
    const res = await fetch(CONFIG.jsonPaths.resume);
    const data = await res.json();

    const resumeHTML = `
        <div class="resume-column">
            <h3 class="panel-subtitle" style="margin-bottom:20px; font-size:1.2rem;"><i class='bx bx-briefcase'></i> Experience</h3>
            ${data.experience.map(exp => `
                <div class="timeline-item">
                    <span class="timeline-date">${exp.period}</span>
                    <h4 class="timeline-role">${exp.role}</h4>
                    <span class="timeline-place">${exp.company}</span>
                    <p class="bio-text" style="font-size:0.9rem;">${exp.desc}</p>
                </div>
            `).join('')}
        </div>
        <div class="resume-column">
            <h3 class="panel-subtitle" style="margin-bottom:20px; font-size:1.2rem;"><i class='bx bx-book-reader'></i> Education</h3>
            ${data.education.map(edu => `
                <div class="timeline-item">
                    <span class="timeline-date">${edu.year}</span>
                    <h4 class="timeline-role">${edu.degree}</h4>
                    <span class="timeline-place">${edu.school}</span>
                </div>
            `).join('')}
            
            <h3 class="panel-subtitle" style="margin-top:40px; margin-bottom:20px; font-size:1.2rem;"><i class='bx bx-code-alt'></i> Tech Stack</h3>
            <div class="card" style="padding:20px;">
                <div class="skill-tags">
                    ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
    document.getElementById('resume-content').innerHTML = resumeHTML;
}

async function fetchAndRenderProjects() {
    const res = await fetch(CONFIG.jsonPaths.projects);
    const data = await res.json();
    state.projects = data;

    // Filters
    const categories = ['all', ...new Set(data.map(item => item.category))];
    const filterHTML = categories.map(cat => 
        `<button class="filter-btn ${cat === 'all' ? 'active' : ''}" data-filter="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`
    ).join('');
    document.getElementById('portfolio-filters').innerHTML = filterHTML;

    // Render Grid
    renderProjectsGrid(data);
    setupFilters();
}

function renderProjectsGrid(projects) {
    const gridHTML = projects.map(p => `
        <div class="work-item" onclick="openModal('project', '${p.id}')">
            <div class="work-image">
                <img src="${p.image}" alt="${p.title}" loading="lazy">
            </div>
            <div class="work-info">
                <h4>${p.title}</h4>
                <span>${p.tech}</span>
            </div>
        </div>
    `).join('');
    document.getElementById('works-grid').innerHTML = gridHTML;
}

async function fetchAndRenderBlog() {
    const res = await fetch(CONFIG.jsonPaths.blog);
    const data = await res.json();
    state.blogPosts = data;

    const blogHTML = data.map(post => {
        const readTime = Math.ceil(post.content.split(' ').length / 200);
        return `
            <article class="card blog-card" onclick="openModal('blog', '${post.id}')">
                <div class="blog-meta">
                    <span>${post.category}</span>
                    <span>${post.date}</span>
                </div>
                <h3>${post.title}</h3>
                <p class="bio-text" style="font-size:0.9rem; margin-bottom:15px;">${post.excerpt}</p>
                <div class="blog-meta" style="margin-top:auto;">
                    <span><i class='bx bx-time'></i> ${readTime} min read</span>
                    <span class="read-more-btn">Read More &rarr;</span>
                </div>
            </article>
        `;
    }).join('');
    document.getElementById('blog-grid').innerHTML = blogHTML;
}

/* -----------------------------------------------------------
   UI LOGIC & INTERACTIONS
----------------------------------------------------------- */

// 1. Navigation (SPA Feel)
function setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-panel');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-page');

            // Update Active State
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === targetId) s.classList.add('active');
            });

            // Mobile: Close drawer
            document.querySelector('.sidebar').classList.remove('active');
            document.querySelector('.sidebar-overlay').classList.remove('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// 2. Mobile Menu
function setupMobileMenu() {
    const btn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    const toggle = () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    };

    btn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
}

// 3. Theme Toggle
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.body.classList.add('dark-theme');
    
    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// 4. Typing Effect
function initTypingEffect(words) {
    const span = document.getElementById('typing-text');
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            span.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            span.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }
    type();
}

// 5. Portfolio Filters
function setupFilters() {
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            const filtered = filter === 'all' 
                ? state.projects 
                : state.projects.filter(p => p.category === filter);
            
            renderProjectsGrid(filtered);
        });
    });
}

// 6. CV Actions
function setupCVActions() {
    document.getElementById('download-cv').href = CONFIG.pdfPath;
    document.getElementById('print-cv').addEventListener('click', () => {
        window.open(CONFIG.pdfPath, '_blank').print();
    });
}

/* -----------------------------------------------------------
   MODAL SYSTEM
----------------------------------------------------------- */
window.openModal = (type, id) => {
    const modal = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    
    let content = '';
    
    if (type === 'blog') {
        const post = state.blogPosts.find(p => p.id === id);
        content = `
            <img src="${post.image}" class="modal-img">
            <span class="modal-date">${post.date} • ${post.category}</span>
            <h2 style="margin-bottom:20px;">${post.title}</h2>
            <div class="modal-body-text">${post.content}</div>
            <div class="giscus-placeholder">
                <i class='bx bx-comment-detail'></i> Comments (Integrated via Giscus)
            </div>
        `;
    } else if (type === 'project') {
        const project = state.projects.find(p => p.id === id);
        content = `
            <img src="${project.image}" class="modal-img">
            <h2 style="margin-bottom:10px;">${project.title}</h2>
            <p style="color:var(--primary-color); margin-bottom:20px;">${project.tech}</p>
            <div class="modal-body-text">
                <p>Detailed project description goes here. This is loaded dynamically based on ID.</p>
                <p>This architecture allows for unlimited project details without cluttering the main HTML file.</p>
            </div>
            <a href="${project.link}" target="_blank" class="btn-primary">View Live Project <i class='bx bx-link-external'></i></a>
        `;
    }

    body.innerHTML = content;
    modal.classList.add('active');
};

document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('active');
});

document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') e.target.classList.remove('active');
});