import json
import urllib.request

BASE_URL = "http://localhost:8000/api/v1"

# Funções auxiliares para requisições HTTP REST na API FastAPI
def get_json(endpoint):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def post_json(endpoint, data):
    payload = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

# Busca todos os cargos e departamentos cadastrados no sistema
positions = get_json("/positions")
departments = get_json("/departments")

# Agrupa apenas os cargos que NÃO são Gerentes (level != MANAGER) por departamento
non_manager_positions = {}
for p in positions:
    if p["level"] != "MANAGER":
        dept_id = p["department_id"]
        if dept_id not in non_manager_positions:
            non_manager_positions[dept_id] = []
        
        # Busca a faixa salarial de mercado vigente para este cargo
        try:
            bands = get_json(f"/salary-bands/position/{p['id']}")
            current_band = next((b for b in bands if b["is_current"]), bands[0] if bands else None)
            mid_sal = float(current_band["mid_salary"]) if current_band else 5000.0
        except Exception as e:
            mid_sal = 5000.0
            
        non_manager_positions[dept_id].append({
            "id": p["id"],
            "title": p["title"],
            "mid_salary": mid_sal
        })

print("Cargos (não gerenciais) disponíveis por departamento:")
for d_id, pos_list in non_manager_positions.items():
    print(f"Dept ID {d_id}: {[p['title'] for p in pos_list]}")

# Listas de nomes e sobrenomes brasileiros reais para geração dos colaboradores
first_names = [
    "Lucas", "Gabriel", "Matheus", "Guilherme", "Gustavo", "Felipe", "Rafael", "Bernardo",
    "Enzo", "Pedro", "Thiago", "Bruno", "Rodrigo", "Diego", "Leonardo", "Samuel",
    "Camila", "Juliana", "Mariana", "Beatriz", "Larissa", "Fernanda", "Patricia", "Aline",
    "Vanessa", "Leticia", "Rafaela", "Gabriela", "Jessica", "Amanda", "Carolina", "Bianca",
    "Carla", "Daniela", "Eduarda", "Isabela", "Luana", "Thais", "Vinicius", "Marcelo"
]

last_names = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
    "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes",
    "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade"
]

# Multiplicadores de salário variados para diversificar a distribuição de Compa-Ratio
# Multiplicadores abaixo de 0.80 = CRÍTICO
# Multiplicadores 0.80 a 0.95 = ABAIXO
# Multiplicadores 0.95 a 1.05 = ADEQUADO
# Multiplicadores 1.05 a 1.20 = ACIMA
# Multiplicadores acima de 1.20 = EXCEDE
salary_multipliers = [0.75, 0.82, 0.88, 0.92, 0.97, 1.00, 1.03, 1.08, 1.14, 1.22]

dept_prefixes = {
    1: ("RH", "2024-02-15"),
    2: ("DEV", "2023-09-10"),
    3: ("MKT", "2024-01-20")
}

created_count = 0

# Itera sobre os 3 departamentos cadastrados (RH, Desenvolvimento, Comercial)
for dept_id in [1, 2, 3]:
    prefix, base_date = dept_prefixes[dept_id]
    pos_list = non_manager_positions[dept_id]
    
    # Cria exatamente 24 empregados para cada departamento
    for i in range(1, 25):
        num_str = f"{i+10:03d}"
        reg_number = f"{prefix}-{num_str}"
        
        # Seleciona o cargo de forma circular dentro dos cargos não gerenciais
        pos = pos_list[(i - 1) % len(pos_list)]
        
        # Seleciona o multiplicador salarial para garantir variabilidade de Compa-Ratio
        mult = salary_multipliers[(i - 1) % len(salary_multipliers)]
        current_salary = round(pos["mid_salary"] * mult, 2)
        
        # Gera nome completo diversificado
        fname = first_names[(i * 3 + dept_id * 7) % len(first_names)]
        lname1 = last_names[(i * 5 + dept_id * 3) % len(last_names)]
        lname2 = last_names[(i * 2 + dept_id * 11) % len(last_names)]
        full_name = f"{fname} {lname1} {lname2}"
        
        emp_payload = {
            "full_name": full_name,
            "registration_number": reg_number,
            "department_id": dept_id,
            "position_id": pos["id"],
            "current_salary": current_salary,
            "hire_date": base_date,
            "status": "ACTIVE"
        }
        
        try:
            res = post_json("/employees", emp_payload)
            created_count += 1
            print(f"[{created_count}/72] Criado: {res['full_name']} ({res['registration_number']}) - Salário: R$ {res['current_salary']} - Ratio: {res.get('compa_ratio')}% ({res.get('compa_ratio_status')})")
        except Exception as err:
            print(f"Erro ao criar {reg_number}: {err}")

print(f"\n========================================================")
print(f" Sucesso! Total de {created_count} colaboradores criados com variabilidade salarial!")
print(f"========================================================")
