class App {
    #grid = undefined;
    #grid_window = undefined;
    #grid_overview = undefined;

    #map_renderer = undefined;
    #render_full_map = false;

    #elements = {
        grid_overview: {
            canvas: undefined,
            lock_size_toggle: undefined,
            controls: {
                up: undefined,
                down: undefined,
                left: undefined,
                right: undefined,
            },
            inputs: {
                top_left: undefined,
                top_right: undefined,
                bottom_left: undefined,
                bottom_right: undefined,
            },
            clear_button: undefined,
        },

        map_canvas: undefined,

        general_settings: {
            dist_scale: undefined,
            step: undefined,
            show_height: undefined,
            show_length: undefined,
            show_as_a_map: undefined,
            show_height_lines: undefined,
        },

        clear_dialog: {
            modal_window: undefined,
            cancel: undefined,
            confirm: undefined,
        },
    };

    get grid() {
        return this.#grid;
    }

    get grid_window() {
        return this.#grid_window;
    }

    get map_renderer() {
        return this.#map_renderer;
    }

    constructor() {
        const compute_flag = 1; // =================================================================== Enable computation?
        if (compute_flag) {
            this.#grid = new ComputedHeightGrid();
            this.#grid_window = new ComputedHeightGridWindow(this.#grid);
        } else {
            this.#grid = new HeightGrid();
            this.#grid_window = new HeightGridWindow(this.#grid);
        }

        if (localStorage.getItem("app_grid") !== null) {
            this.#grid.load_from_name("app_grid");
        }

        // this.#grid_overview_renderer = new GridOverview(canvas);

        this.#grid.onupdate = this.#on_grid_update.bind(this);
        this.#grid_window.onupdate = this.#on_grid_window_update.bind(this);
    }

    start() {
        console.group("App starting");

        this.#find_elements();

        console.log("Elements:", this.#elements);

        this.#bind_elements();

        console.groupEnd();

        this.#grid_overview.render(this.#grid_window);
        this.#render_map();
    }

    #find_elements() {
        this.#elements.map_canvas = document.getElementById("map_canvas");
        this.#find_grid_overview_controls();
        this.#find_settings_controls();
        this.#find_clear_dialog();
    }

    #find_grid_overview_controls() {
        const grid_overview = this.#elements.grid_overview;

        grid_overview.canvas = document.getElementById("grid_overview_canvas");
        grid_overview.lock_size_toggle = document.getElementById("lock_expansion_toggle");

        const data_input_panel = document.getElementById("data_input_panel");
        for (const element of data_input_panel.children) {
            if (element.attributes["direction"]) {
                const dir_name = element.attributes["direction"].value;
                const dir_vector = LUT.NAME_TO_DIRECTION.get(dir_name);

                if (dir_vector) {
                    element.direction = dir_vector;
                    grid_overview.controls[dir_name] = element;
                }
            }

            if (element.attributes["corner"]) {
                const corner_name = element.attributes["corner"].value;
                const corner_symbol = LUT.NAME_TO_CORNER.get(corner_name);

                if (corner_symbol) {
                    element.corner = corner_symbol;
                    grid_overview.inputs[corner_name] = element;
                }
            }
        }

        grid_overview.clear_button = document.getElementById("clear_grid");
    }

    #find_settings_controls() {
        const general_settings = this.#elements.general_settings;

        general_settings.dist_scale = document.getElementById("dist_scale");
        general_settings.step = document.getElementById("step");
        general_settings.show_height = document.getElementById("show_height");
        general_settings.show_length = document.getElementById("show_length");
        general_settings.show_as_a_map = document.getElementById("show_as_a_map");
        general_settings.show_height_lines = document.getElementById("show_height_lines");
        general_settings.show_height_lines_labels = document.getElementById("show_height_lines_labels");
    }

    #find_clear_dialog() {
        const clear_dialog = this.#elements.clear_dialog;

        clear_dialog.modal_window = document.getElementById("clear_dialog");
        clear_dialog.cancel = document.getElementById("clear_dialog_cancel");
        clear_dialog.confirm = document.getElementById("clear_dialog_confirm");
    }

    #bind_elements() {
        this.#bind_grid_overview_controls();
        this.#bind_map_renderer();
        this.#bind_setting_controls();
        this.#bind_clear_dialog();
    }

    #bind_grid_overview_controls() {
        this.#grid_overview = new GridOverview(this.#elements.grid_overview.canvas);
        this.#grid_overview.onresize = this.#on_grid_overview_resize.bind(this);

        const grid_overview = this.#elements.grid_overview;

        this.grid.is_expansion_locked = grid_overview.lock_size_toggle.checked;
        grid_overview.lock_size_toggle.oninput = ((event) => {
            this.grid.is_expansion_locked = event.target.checked;
            this.#update_grid_controls();
        }).bind(this);

        for (const element_name in grid_overview.controls) {
            const element = grid_overview.controls[element_name];
            element.onclick = (() => {
                this.#grid_window.offset_by(element.direction);
            }).bind(this);
        }

        for (const element_name in grid_overview.inputs) {
            const element = grid_overview.inputs[element_name];
            element.oninput = (() => {
                this.#grid_window.set(element.corner, parseFloat(element.value));
            }).bind(this);
        }

        grid_overview.clear_button.onclick = ((event) => {
            this.#set_clear_dialog_visible(true);
        }).bind(this);

        this.#update_grid_controls();
    }

    #bind_map_renderer() {
        this.#map_renderer = new MapRenderer(this.#elements.map_canvas);
        this.#map_renderer.onresize = this.#on_map_renderer_resize.bind(this);
    }

    #bind_setting_controls() {
        const general_settings = this.#elements.general_settings;

        this.#map_renderer.settings.chunk_scale_size = parseFloat(general_settings.dist_scale.value);
        general_settings.dist_scale.oninput = ((event) => {
            this.#map_renderer.settings.chunk_scale_size = parseFloat(event.target.value);
            this.#render_map();
        }).bind(this);

        if (this.#grid instanceof ComputedHeightGrid || this.#grid_window instanceof ComputedHeightGridWindow) {
            general_settings.step.parentElement.style.display = "block";

            if (this.#grid instanceof ComputedHeightGrid) this.#grid.step = parseFloat(general_settings.step.value);
            if (this.#grid_window instanceof ComputedHeightGridWindow) this.#grid_window.step = parseFloat(general_settings.step.value);

            general_settings.step.oninput = ((event) => {
                if (this.#grid instanceof ComputedHeightGrid) this.#grid.step = parseFloat(event.target.value);
                if (this.#grid_window instanceof ComputedHeightGridWindow) this.#grid_window.step = parseFloat(event.target.value);
                this.#render_map();
            }).bind(this);
        } else {
            general_settings.step.parentElement.style.display = "none";
        }

        this.#map_renderer.settings.show_vertex_height = general_settings.show_height.checked;
        general_settings.show_height.oninput = ((event) => {
            this.#map_renderer.settings.show_vertex_height = event.target.checked;
            this.#render_map();
        }).bind(this);

        this.#map_renderer.settings.show_side_length = general_settings.show_length.checked;
        general_settings.show_length.oninput = ((event) => {
            this.#map_renderer.settings.show_side_length = event.target.checked;
            this.#render_map();
        }).bind(this);

        this.#render_full_map = general_settings.show_as_a_map.checked;
        general_settings.show_as_a_map.oninput = ((event) => {
            this.#render_full_map = event.target.checked;
            this.#render_map();
        }).bind(this);

        this.#map_renderer.settings.show_height_lines = general_settings.show_height_lines.checked;
        general_settings.show_height_lines_labels.parentElement.style.display = general_settings.show_height_lines.checked ? "block" : "none";
        general_settings.show_height_lines.oninput = ((event) => {
            this.#map_renderer.settings.show_height_lines = event.target.checked;
            general_settings.show_height_lines_labels.parentElement.style.display = event.target.checked ? "block" : "none";
            this.#render_map();
        }).bind(this);

        this.#map_renderer.settings.show_height_lines_labels = general_settings.show_height_lines_labels.checked;
        general_settings.show_height_lines_labels.oninput = ((event) => {
            this.#map_renderer.settings.show_height_lines_labels = event.target.checked;
            this.#render_map();
        }).bind(this);
    }

    #bind_clear_dialog() {
        const clear_dialog = this.#elements.clear_dialog;

        clear_dialog.cancel.onclick = ((event) => {
            this.#set_clear_dialog_visible(false);
        }).bind(this);

        clear_dialog.confirm.onclick = ((event) => {
            console.log("here");
            this.#grid.clear();
            this.#grid_window.reset();
            this.#update_grid_controls();
            this.#grid_overview.render(this.#grid_window);
            this.#render_map();
            this.#set_clear_dialog_visible(false);
        }).bind(this);

        clear_dialog.modal_window.onclose = ((event) => {
            event.target.classList.toggle("show", false);
        }).bind(this);
    }

    #set_clear_dialog_visible(is_visible) {
        console.log(this.#elements.clear_dialog.modal_window);
        if (is_visible) {
            this.#elements.clear_dialog.modal_window.showModal();
            this.#elements.clear_dialog.modal_window.classList.toggle("show", true);
        } else {
            this.#elements.clear_dialog.modal_window.classList.toggle("show", false);
            this.#elements.clear_dialog.modal_window.close();
        }
    }

    #update_grid_controls() {
        const grid_overview = this.#elements.grid_overview;

        // grid_overview.lock_size_toggle.checked = this.grid.is_expansion_locked;

        for (const element_name in grid_overview.controls) {
            const element = grid_overview.controls[element_name];
            element.disabled = this.#grid.is_expansion_locked && !this.#grid_window.can_offset_by(element.direction);
            // console.log(element, element.disabled);
        }

        for (const element_name in grid_overview.inputs) {
            const element = grid_overview.inputs[element_name];
            if (document.activeElement !== element) element.value = this.#grid_window.get(element.corner);
            // console.log(element, element.disabled);
        }
    }

    #on_grid_update() {
        console.log("Grid updated");
        this.#grid.save_with_name("app_grid");
        this.#update_grid_controls();
        this.#render_map();
    }

    #on_grid_window_update() {
        this.#update_grid_controls();
        this.#grid_overview.render(this.#grid_window);
        this.#render_map();
    }

    #on_grid_overview_resize() {
        this.#grid_overview.render(this.#grid_window);
    }

    #on_map_renderer_resize() {
        // console.log("Map resized");
        this.#render_map(false);
    }

    #render_map(try_to_resize = true) {
        if (this.#render_full_map) {
            if (try_to_resize) {
                this.#map_renderer.set_canvas_size(this.#map_renderer.preferred_size_for_grid(this.#grid));
            }
            this.#map_renderer.render_full_map(this.#grid);
        } else {
            if (try_to_resize) {
                this.#map_renderer.set_canvas_size(this.#map_renderer.preferred_size_for_window(this.#grid_window));
            }
            this.#map_renderer.render_window(this.#grid_window);
        }
    }
}
