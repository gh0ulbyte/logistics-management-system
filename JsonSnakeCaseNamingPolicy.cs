using System.Text.Json;

namespace Kael.Api;

public class JsonSnakeCaseNamingPolicy : JsonNamingPolicy
{
    public override string ConvertName(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;
        var list = new List<char> { char.ToLowerInvariant(name[0]) };
        for (int i = 1; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c))
            {
                list.Add('_');
                list.Add(char.ToLowerInvariant(c));
            }
            else
                list.Add(c);
        }
        return new string(list.ToArray());
    }
}
