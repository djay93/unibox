import pandas as pd
import logging
from time import time

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def vlookup_from_json(config):
    start_time = time()
    logger.info("Starting vlookup_from_json function")

    # Load the input file
    logger.info(f"Loading input file: {config['input_file']}")
    input_df = pd.read_excel(config['input_file'])
    logger.info(f"Input file loaded. Shape: {input_df.shape}")

    # Pre-load all lookup files
    lookup_dfs = {}
    for lookup_key, lookup_config in config.items():
        if lookup_key.startswith('lookup_'):
            logger.info(f"Loading lookup file: {lookup_config['lookup_file']}")
            lookup_dfs[lookup_key] = pd.read_excel(lookup_config['lookup_file'])
            logger.info(f"Lookup file {lookup_key} loaded. Shape: {lookup_dfs[lookup_key].shape}")

    # Optimize lookup function
    def perform_lookup(input_values, lookup_config, lookup_df):
        column_a = lookup_config['lookup_column_a']
        column_b = lookup_config['lookup_column_b']
        
        # Create sets for faster lookups
        set_a = set(lookup_df[column_a])
        set_b = set(lookup_df[column_b])
        
        def lookup_logic(value):
            in_a = value in set_a
            in_b = value in set_b
            if in_a and in_b:
                return lookup_config['both_columns']
            elif in_a:
                return lookup_config['only_column_a']
            elif in_b:
                return lookup_config['only_column_b']
            else:
                return lookup_config['na_value']
        
        # Vectorized lookup
        results = input_values.map(lookup_logic)
        return results

    # Apply lookups
    for lookup_key, lookup_config in config.items():
        if lookup_key.startswith('lookup_'):
            logger.info(f"Performing lookup: {lookup_key}")
            start_lookup = time()
            
            # Apply the lookup for all rows at once
            input_df[lookup_key] = perform_lookup(
                input_df[config['input_lookup_column']],
                lookup_config,
                lookup_dfs[lookup_key]
            )
            
            logger.info(f"Lookup {lookup_key} completed in {time() - start_lookup:.2f} seconds")

    # Save the updated dataframe back to the file
    output_file = "updated_" + config['input_file']
    logger.info(f"Saving updated file to: {output_file}")
    input_df.to_excel(output_file, index=False)
    logger.info(f"Updated file saved. Shape: {input_df.shape}")

    total_time = time() - start_time
    logger.info(f"vlookup_from_json completed in {total_time:.2f} seconds")

# Example config from the JSON-like structure
config = {
    "input_file": "input_data.xlsx",
    "input_lookup_column": "C",
    "lookup_1": {
        "lookup_file": "lookup1.xlsx",
        "lookup_column_a": "A",
        "lookup_column_b": "B",
        "both_columns": "xyz",
        "only_column_a": "ABC",
        "only_column_b": "ZZZ",
        "na_value": "YYY"
    },
}

if __name__ == "__main__":
    # Call the function with the provided config
    vlookup_from_json(config)
