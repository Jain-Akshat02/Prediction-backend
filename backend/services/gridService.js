const axios = require('axios');

const generateGrid = async (coordinates, gridSpacing = 0.5) => {
  const response = await axios.post(
    'http://127.0.0.1:8000/predict-polygon',
    {
      coordinates,
      grid_spacing: gridSpacing
    }
  );

  console.log('Polygon prediction service response:', response.data);

  return response.data;
};

module.exports = {
  generateGrid
};

