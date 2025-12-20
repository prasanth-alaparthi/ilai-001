-- Lab Computations Database Schema
-- For muse_labs database

-- Core table for all lab results
CREATE TABLE IF NOT EXISTS lab_computations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    lab_type VARCHAR(50) NOT NULL, -- 'physics', 'chemistry', 'biology', etc.
    problem_input JSONB NOT NULL,
    derivation_latex TEXT,
    result_data JSONB,
    assumptions JSONB,
    evidence TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lab_computations_user_id ON lab_computations(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_computations_lab_type ON lab_computations(lab_type);
CREATE INDEX IF NOT EXISTS idx_lab_computations_created_at ON lab_computations(created_at);

-- Physics-specific parameters
CREATE TABLE IF NOT EXISTS physics_problems (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    equation_type VARCHAR(50), -- 'ode', 'pde', 'algebraic'
    symbols JSONB, -- {"x": "position", "t": "time"}
    boundary_conditions JSONB
);

-- Chemistry molecules
CREATE TABLE IF NOT EXISTS chemistry_molecules (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    smiles VARCHAR(500),
    molecular_weight DECIMAL(10,4),
    formula VARCHAR(100),
    inchi TEXT,
    num_atoms INT,
    num_bonds INT,
    properties JSONB
);

-- Biology sequences
CREATE TABLE IF NOT EXISTS biology_sequences (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    dna_sequence TEXT,
    mrna_sequence TEXT,
    protein_sequence TEXT,
    dna_molecular_weight DECIMAL(15,4),
    protein_molecular_weight DECIMAL(15,4),
    gc_content DECIMAL(5,2)
);

-- Code executions
CREATE TABLE IF NOT EXISTS code_executions (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    language VARCHAR(20),
    source_code TEXT,
    stdout TEXT,
    stderr TEXT,
    return_code INT,
    execution_time_ms INT
);

-- Economics models
CREATE TABLE IF NOT EXISTS economics_models (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    model_type VARCHAR(50), -- 'equilibrium', 'elasticity'
    supply_function TEXT,
    demand_function TEXT,
    equilibrium_price DECIMAL(15,4),
    equilibrium_quantity DECIMAL(15,4),
    elasticity_supply DECIMAL(10,4),
    elasticity_demand DECIMAL(10,4)
);

-- Literary analysis
CREATE TABLE IF NOT EXISTS literary_analysis (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    text_content TEXT,
    scansion_pattern VARCHAR(200),
    syllable_count INT,
    meter_type VARCHAR(50),
    is_iambic_pentameter BOOLEAN,
    word_breakdown JSONB
);

-- Linguistic analysis
CREATE TABLE IF NOT EXISTS linguistic_analysis (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    sentence TEXT,
    dependencies JSONB,
    pos_tags JSONB,
    morphology JSONB,
    entities JSONB
);

-- Fashion patterns
CREATE TABLE IF NOT EXISTS fashion_patterns (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    bust DECIMAL(5,2),
    waist DECIMAL(5,2),
    hips DECIMAL(5,2),
    pattern_method VARCHAR(50),
    pattern_pieces JSONB,
    svg_output TEXT
);

-- Social networks
CREATE TABLE IF NOT EXISTS social_networks (
    id UUID PRIMARY KEY REFERENCES lab_computations(id) ON DELETE CASCADE,
    network_type VARCHAR(50),
    nodes JSONB,
    edges JSONB,
    num_nodes INT,
    num_edges INT,
    density DECIMAL(10,4),
    is_connected BOOLEAN,
    degree_centrality JSONB,
    betweenness_centrality JSONB,
    clustering_coefficient JSONB
);
