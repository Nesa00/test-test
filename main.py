import customtkinter as ctk
import datetime
import json

# Load protein config
with open("protein_config.json", "r") as f:
    protein_config = json.load(f)

class ProteinApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Protein Tracker")
        self.geometry("800x600")
        ctk.set_appearance_mode("light")
        ctk.set_default_color_theme("blue")

        self.selected_foods = {}
        self.food_widgets = {}  # Keep UI widgets to persist state

        self.create_widgets()

    def create_widgets(self):
        # Top row: Buttons
        button_frame = ctk.CTkFrame(self)
        button_frame.pack(pady=10)

        self.calc_button = ctk.CTkButton(button_frame, text="Calculate", command=self.calculate_protein)
        self.calc_button.pack(side="left", padx=10)

        self.save_button = ctk.CTkButton(button_frame, text="Save", command=self.save)
        self.save_button.pack(side="left", padx=10)

        # Results and message display
        self.result_label = ctk.CTkLabel(self, text="Total Protein: 0g | Remaining: 0g", font=("Arial", 14))
        self.result_label.pack(pady=2)

        self.output_label = ctk.CTkLabel(self, text="", text_color="red")
        self.output_label.pack(pady=2)

        # Daily target
        self.target_label = ctk.CTkLabel(self, text="Daily Protein Target (g):")
        self.target_label.pack(pady=(10, 0))

        self.target_entry = ctk.CTkEntry(self, placeholder_text="e.g. 150")
        self.target_entry.pack(pady=5)

        # Search bar
        self.search_entry = ctk.CTkEntry(self, placeholder_text="Search food...")
        self.search_entry.pack(pady=10)
        self.search_entry.bind("<KeyRelease>", self.update_search_results)

        # Frame for results
        self.results_frame = ctk.CTkScrollableFrame(self, width=700, height=350)
        self.results_frame.pack(pady=10)

        # Initially show all foods
        self.update_search_results()


    def update_search_results(self, event=None):
        query = self.search_entry.get().strip().lower()

        for food, frame in self.food_widgets.items():
            if query == "" or query in food:
                frame.pack(fill="x", pady=2, padx=10)
            else:
                frame.pack_forget()

        # If first time adding entries, create them now
        for food in protein_config:
            if food not in self.food_widgets:
                if query == "" or query in food:
                    self.add_food_row(food)


    def add_food_row(self, food):
        frame = ctk.CTkFrame(self.results_frame)
        frame.pack(fill="x", pady=2, padx=10)

        var = ctk.BooleanVar()
        label = ctk.CTkLabel(frame,width=200)
        entry = ctk.CTkEntry(frame, width=80, placeholder_text="grams")

        # Restore if previously created
        if food in self.selected_foods:
            var.set(self.selected_foods[food]["var"].get())
            entry.insert(0, self.selected_foods[food]["entry"].get())

        label.configure(text=f"{protein_config[food]} g/100g {food}")
        checkbox = ctk.CTkCheckBox(frame, text="", variable=var)
        checkbox.grid(row=0, column=0)
        label.grid(row=0, column=1, padx=(10, 0))
        entry.grid(row=0, column=2, padx=(10, 0))

        self.selected_foods[food] = {"var": var, "label": label, "entry": entry}
        self.food_widgets[food] = frame

    
    def calculate_protein(self):
        try:
            target = float(self.target_entry.get())
        except ValueError:
            self.output_label.configure(text="⚠️ Please enter a valid daily protein target.")
            return

        total = 0
        entries = []

        for food, widgets in self.selected_foods.items():
            if widgets["var"].get():
                try:
                    amount = float(widgets["entry"].get())
                    if amount <= 0:
                        raise ValueError
                except ValueError:
                    self.output_label.configure(text=f"⚠️ Invalid weight for '{food}'.")
                    return

                protein_per_100g = protein_config[food]
                protein = round((amount / 100) * protein_per_100g, 2)
                total += protein
                entries.append({
                    "food": food,
                    "amount": amount,
                    "protein": protein
                })

        if total == 0:
            self.output_label.configure(text="⚠️ No valid food entries found.")
            return

        remaining = round(max(target - total, 0), 2)
        log = {
            "target": target,
            "entries": entries,
            "total_protein": round(total, 2),
            "remaining_protein": remaining
        }

        # Save to generic log.json
        with open("log.json", "w") as f:
            json.dump(log, f, indent=4)

        self.latest_log = log  # Save it for use in save_to_timestamp_log

        self.result_label.configure(
            text=f"✅ Total Protein: {total:.2f}g | Remaining: {remaining:.2f}g"
        )
        self.output_label.configure(text="Saved to log.json", text_color="green")


    def save(self):
        if not hasattr(self, "latest_log"):
            self.output_label.configure(text="⚠️ You must calculate first before saving.")
            return

        now = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"{now}.json"
        with open(filename, "w") as f:
            json.dump(self.latest_log, f, indent=4)

        self.output_label.configure(text=f"📁 Saved as {filename}")



if __name__ == "__main__":
    app = ProteinApp()
    app.mainloop()
